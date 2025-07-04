import React from 'react'
import SargamIcon from './SargamIcon'

const WithdrawalModal = ({ isVisible, onClose }) => {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <SargamIcon name="info" className="w-5 h-5 text-blue-500" />
            <span className="ml-2">Withdrawal Mode</span>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <SargamIcon name="close" className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>🎯 Production Note:</strong> Withdrawals are processed through the Stellar network.
            </p>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Withdrawal Process:</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>✅ Connect your Stellar wallet</li>
              <li>✅ Select withdrawal amount and asset</li>
              <li>✅ Confirm transaction details</li>
              <li>✅ Sign transaction with your wallet</li>
              <li>✅ Funds transferred to your account</li>
            </ul>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              This demonstrates the withdrawal flow without requiring complex treasury management.
            </p>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Close
            </button>
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WithdrawalModal 