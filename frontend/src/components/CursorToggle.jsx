import React from 'react';
import SargamIcon from './SargamIcon';

/**
 * CursorToggle Component
 * Allows users to toggle cursor effects on/off
 */
const CursorToggle = ({ enabled, onToggle }) => {
  return (
    <button
      onClick={() => onToggle(!enabled)}
      className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg transition-all duration-300 hover:scale-110"
      title={enabled ? "Disable cursor effects" : "Enable cursor effects"}
    >
      {enabled ? (
        <SargamIcon name="sparkles" size={24} color="white" />
      ) : (
        <SargamIcon name="mouse-pointer" size={24} color="white" />
      )}
    </button>
  );
};

export default CursorToggle; 