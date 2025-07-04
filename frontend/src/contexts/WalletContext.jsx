import React, { createContext, useContext, useState, useEffect } from 'react'
import { StellarWalletsKit, WalletNetwork, allowAllModules } from '@creit.tech/stellar-wallets-kit'
import toast from 'react-hot-toast'

// Create the context that will hold wallet state and functions
const WalletContext = createContext()

/**
 * Custom hook to use the wallet context
 * This provides easy access to wallet state and functions from any component
 * Usage: const { isConnected, publicKey, connectWallet } = useWallet()
 */
export const useWallet = () => {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}

/**
 * WalletProvider component that manages Stellar wallet connections
 * Uses Stellar Wallets Kit for robust multi-wallet support
 */
export const WalletProvider = ({ children }) => {
  // State to track wallet connection status
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  
  // State to store the user's Stellar public key (wallet address)
  const [publicKey, setPublicKey] = useState(null)
  
  // State to track if we're currently connecting (for loading states)
  const [isConnecting, setIsConnecting] = useState(false)
  
  // State to track the connected wallet type
  const [walletType, setWalletType] = useState(null)

  // Initialize Stellar Wallets Kit
  const [walletsKit, setWalletsKit] = useState(null)

  useEffect(() => {
    // Initialize the Stellar Wallets Kit
    const initWalletsKit = () => {
      try {
        const kit = new StellarWalletsKit({
          network: WalletNetwork.TESTNET, // Using testnet for development
          selectedWalletId: null,
          modules: allowAllModules(), // Support all available wallets
        })
        
        setWalletsKit(kit)
        console.log('✅ Stellar Wallets Kit initialized successfully')
        
        // Check for existing connection
        checkExistingConnection(kit)
      } catch (error) {
        console.error('❌ Failed to initialize Stellar Wallets Kit:', error)
        toast.error('Failed to initialize wallet system')
      }
    }

    initWalletsKit()
  }, [])

  /**
   * Check if there's an existing wallet connection
   */
  const checkExistingConnection = async (kit) => {
    try {
      const storedWalletId = localStorage.getItem('selectedWalletId')
      const storedPublicKey = localStorage.getItem('publicKey')
      
      if (storedWalletId && storedPublicKey && kit) {
        // Try to restore connection
        kit.setWallet(storedWalletId)
        
        // Verify the connection is still valid
        const { address } = await kit.getAddress()
        
        if (address === storedPublicKey) {
          setIsWalletConnected(true)
          setPublicKey(address)
          setWalletType(storedWalletId)
          console.log('✅ Wallet connection restored:', address.slice(0, 4) + '...')
        } else {
          // Connection invalid, clear stored data
          disconnectWallet()
        }
      }
    } catch (error) {
      console.error('Error checking existing connection:', error)
      // Clear stored data if there's an error
      disconnectWallet()
    }
  }

  /**
   * Function to connect to a Stellar wallet
   * Shows wallet selection modal and handles connection
   */
  const connectWallet = async () => {
    if (!walletsKit) {
      toast.error('Wallet system not initialized. Please refresh the page.')
      return false
    }

    setIsConnecting(true)
    
    try {
      console.log('🔍 Opening wallet selection modal...')
      
      // Open wallet selection modal with callback
      await walletsKit.openModal({
        onWalletSelected: async (option) => {
          console.log('📱 Wallet selected:', option.name)
          toast.loading('Connecting to ' + option.name + '...', { id: 'connecting' })
          
          try {
            console.log('🔐 Setting wallet and requesting address...')
            
            // Set the selected wallet
            walletsKit.setWallet(option.id)
            
            // Get the address (this will trigger wallet connection)
            const { address } = await walletsKit.getAddress()
            
            if (address) {
              // Update our state with the connection info
              setPublicKey(address)
              setIsWalletConnected(true)
              setWalletType(option.id)
              
              // Store in localStorage so connection persists between sessions
              localStorage.setItem('selectedWalletId', option.id)
              localStorage.setItem('publicKey', address)
              
              toast.dismiss('connecting')
              toast.success('Wallet connected successfully!')
              
              console.log('✅ Wallet connected:', address.slice(0, 4) + '...')
              setIsConnecting(false)
            } else {
              throw new Error('Failed to get address from wallet')
            }
          } catch (walletError) {
            console.error('❌ Error in wallet selection callback:', walletError)
            toast.dismiss('connecting')
            
            // Provide more specific error messages
            if (walletError.message.includes('User rejected') || walletError.message.includes('denied')) {
              toast.error('Wallet connection was cancelled.')
            } else if (walletError.message.includes('not installed') || walletError.message.includes('not available')) {
              toast.error('Wallet not installed or not available. Please install the wallet extension.')
            } else if (walletError.message.includes('Failed to get address')) {
              toast.error('Failed to access wallet. Please try again.')
            } else {
              toast.error('Failed to connect wallet. Please try refreshing the page.')
            }
            setIsConnecting(false)
          }
        },
        onClosed: (error) => {
          if (error) {
            console.log('❌ Modal closed with error:', error)
          } else {
            console.log('ℹ️ Modal closed by user')
          }
          setIsConnecting(false)
        }
      })

      return true
    } catch (error) {
      console.error('❌ Error opening wallet modal:', error)
      
      toast.error('Failed to open wallet selection. Please try refreshing the page.')
      setIsConnecting(false)
      return false
    }
  }

  /**
   * Function to disconnect the wallet
   * This clears all stored wallet data
   */
  const disconnectWallet = () => {
    setIsWalletConnected(false)
    setPublicKey(null)
    setWalletType(null)
    
    // Clear localStorage
    localStorage.removeItem('selectedWalletId')
    localStorage.removeItem('publicKey')
    
    // Reset the wallet kit (don't pass null to avoid errors)
    if (walletsKit) {
      try {
        walletsKit.setWallet(null)
      } catch (error) {
        console.log('Note: Wallet kit reset (expected behavior)')
      }
    }
    
    toast.success('Wallet disconnected')
  }

  /**
   * Function to get a shortened version of the public key for display
   * Example: GDSW...XYZ instead of the full 56-character key
   */
  const getShortPublicKey = () => {
    if (!publicKey) return ''
    return `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`
  }

  /**
   * Function to sign a transaction
   * This uses the connected wallet to sign a Stellar transaction
   */
  const signTransaction = async (transactionXdr, networkPassphrase) => {
    if (!walletsKit || !isWalletConnected) {
      throw new Error('No wallet connected')
    }

    try {
      // Use the provided network passphrase or default to testnet
      const network = networkPassphrase || 'Test SDF Network ; September 2015'
      
      const { signedTxXdr } = await walletsKit.signTransaction(transactionXdr, {
        address: publicKey,
        networkPassphrase: network,
      })
      
      return signedTxXdr
    } catch (error) {
      console.error('❌ Error signing transaction:', error)
      if (error.message.includes('User rejected') || error.message.includes('denied')) {
        throw new Error('Transaction was cancelled by user')
      } else if (error.message.includes('not found') || error.message.includes('no wallet')) {
        throw new Error('Wallet not available. Please check your wallet connection.')
      } else {
        throw new Error('Failed to sign transaction: ' + error.message)
      }
    }
  }

  /**
   * Check if any wallet is available (for debugging)
   */
  const checkWalletAvailability = () => {
    const walletInfo = {
      stellarWalletsKit: !!walletsKit,
      freighterExtension: typeof window.freighter !== 'undefined',
      freighterApi: typeof window.freighterApi !== 'undefined',
      stellarObject: typeof window.stellar !== 'undefined',
      isChrome: /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor),
      userAgent: navigator.userAgent
    }
    
    console.log('🔍 Wallet availability check:', walletInfo)
    return walletInfo
  }

  // The value object that will be provided to all child components
  const value = {
    // State values
    isConnected: isWalletConnected,
    publicKey,
    isConnecting,
    walletType,
    
    // Utility functions
    getShortPublicKey,
    checkWalletAvailability,
    
    // Action functions
    connectWallet,
    disconnectWallet,
    signTransaction,
    
    // Access to the wallets kit for advanced usage
    walletsKit,
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
} 