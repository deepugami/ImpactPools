import React from 'react';

/**
 * SargamIcon Component
 * A wrapper component for using Sargam Icons in React
 * Uses the clean Line style icons from Sargam Icons
 */
const SargamIcon = ({ 
  name, 
  size = 24, 
  color = 'currentColor', 
  className = '',
  style = {},
  ...props 
}) => {
  // Map of Lucide icon names to Sargam icon names
  const iconMap = {
    // Navigation & UI
    'arrow-left': 'si_Arrow_left',
    'arrow-right': 'si_Arrow_right',
    'arrow-up': 'si_Arrow_upward',
    'arrow-down': 'si_Arrow_downward',
    'plus': 'si_Add',
    'minus': 'si_Remove',
    'home': 'si_Home',
    'external-link': 'si_Arrow_right',

    // Financial & Business
    'coins': 'si_Money',
    'trending-up': 'si_Arrow_upward',
    'trending-down': 'si_Arrow_downward',
    'users': 'si_User',
    'wallet': 'si_Wallet',
    'bar-chart-3': 'si_Insights',
    'percent': 'si_Add', // Using add icon as fallback for percent

    // Status & Feedback
    'heart': 'si_Heart',
    'check-circle': 'si_Check_circle',
    'alert-circle': 'si_Error',
    'alert-triangle': 'si_Warning',
    'loader-2': 'si_Spinner',
    'refresh-cw': 'si_Spinner', // Using spinner for refresh

    // Data & Information
    'calendar': 'si_Clock', // Using clock as calendar substitute
    'info': 'si_Info',
    'history': 'si_Clock',
    'activity': 'si_Insights',

    // Interactive Effects
    'sparkles': 'si_Star',
    'mouse-pointer': 'si_Add', // Using add as pointer substitute

    // Additional common icons
    'search': 'si_Search',
    'settings': 'si_Settings',
    'user': 'si_User',
    'check': 'si_Check',
    'x': 'si_Close',
    'close': 'si_Close',
    'star': 'si_Star',
    'clock': 'si_Clock',
    'more-horizontal': 'si_More_horiz',
    'more-vertical': 'si_More_vert'
  };

  // Get the Sargam icon name from the mapping
  const sargamIconName = iconMap[name] || iconMap['star']; // fallback to star

  // Build the public path to the SVG
  const iconPath = `/icons/${sargamIconName}.svg`;

  // Combined styles
  const iconStyle = {
    width: size,
    height: size,
    display: 'inline-block',
    verticalAlign: 'middle',
    fill: color,
    stroke: color,
    color: color,
    ...style
  };

  return (
    <span
      className={`sargam-icon ${className}`}
      style={iconStyle}
      {...props}
    >
      <img
        src={iconPath}
        alt={name}
        style={{
          width: '100%',
          height: '100%',
          filter: color !== 'currentColor' && color !== 'inherit' ? getColorFilter(color) : undefined
        }}
        onError={(e) => {
          // Fallback to a default icon if the specific icon is not found
          console.warn(`Icon not found: ${iconPath}, falling back to star icon`);
          e.target.src = '/icons/si_Star.svg';
        }}
      />
    </span>
  );
};

/**
 * Helper function to convert color to CSS filter for SVG coloring
 */
function getColorFilter(color) {
  // Convert common colors to CSS filters
  const colorMap = {
    'white': 'brightness(0) saturate(100%) invert(100%)',
    '#ffffff': 'brightness(0) saturate(100%) invert(100%)',
    'black': 'brightness(0) saturate(100%) invert(0%)',
    '#000000': 'brightness(0) saturate(100%) invert(0%)',
    '#a855f7': 'brightness(0) saturate(100%) invert(48%) sepia(79%) saturate(2476%) hue-rotate(240deg) brightness(98%) contrast(95%)', // purple-500
    '#8b5cf6': 'brightness(0) saturate(100%) invert(45%) sepia(62%) saturate(2865%) hue-rotate(240deg) brightness(99%) contrast(96%)', // purple-400
    '#3b82f6': 'brightness(0) saturate(100%) invert(40%) sepia(96%) saturate(1815%) hue-rotate(213deg) brightness(99%) contrast(96%)', // blue-500
    '#60a5fa': 'brightness(0) saturate(100%) invert(58%) sepia(73%) saturate(1787%) hue-rotate(201deg) brightness(99%) contrast(97%)', // blue-400
    '#ec4899': 'brightness(0) saturate(100%) invert(56%) sepia(61%) saturate(3895%) hue-rotate(316deg) brightness(100%) contrast(89%)', // pink-500
    '#f472b6': 'brightness(0) saturate(100%) invert(69%) sepia(89%) saturate(2159%) hue-rotate(294deg) brightness(101%) contrast(91%)', // pink-400
    '#ef4444': 'brightness(0) saturate(100%) invert(42%) sepia(93%) saturate(1352%) hue-rotate(343deg) brightness(104%) contrast(94%)', // red-500
    '#10b981': 'brightness(0) saturate(100%) invert(61%) sepia(14%) saturate(2137%) hue-rotate(119deg) brightness(94%) contrast(86%)', // green-500
    '#22c55e': 'brightness(0) saturate(100%) invert(71%) sepia(77%) saturate(2834%) hue-rotate(88deg) brightness(101%) contrast(107%)', // green-400
    '#f59e0b': 'brightness(0) saturate(100%) invert(70%) sepia(56%) saturate(1934%) hue-rotate(7deg) brightness(101%) contrast(103%)', // yellow-500
    '#facc15': 'brightness(0) saturate(100%) invert(89%) sepia(58%) saturate(1449%) hue-rotate(3deg) brightness(101%) contrast(103%)', // yellow-400
    '#d8b4fe': 'brightness(0) saturate(100%) invert(83%) sepia(39%) saturate(1686%) hue-rotate(235deg) brightness(102%) contrast(98%)', // purple-300
    '#a78bfa': 'brightness(0) saturate(100%) invert(64%) sepia(55%) saturate(2013%) hue-rotate(235deg) brightness(99%) contrast(98%)', // purple-400
    '#f97316': 'brightness(0) saturate(100%) invert(60%) sepia(96%) saturate(1815%) hue-rotate(15deg) brightness(99%) contrast(101%)', // orange-500
    '#6b7280': 'brightness(0) saturate(100%) invert(52%) sepia(18%) saturate(398%) hue-rotate(202deg) brightness(91%) contrast(86%)', // gray-500
    '#9ca3af': 'brightness(0) saturate(100%) invert(69%) sepia(9%) saturate(513%) hue-rotate(202deg) brightness(94%) contrast(86%)', // gray-400
    'currentColor': null
  };

  return colorMap[color] || colorMap[color.toLowerCase()] || 'brightness(0) saturate(100%) invert(48%) sepia(79%) saturate(2476%) hue-rotate(240deg) brightness(98%) contrast(95%)';
}

export default SargamIcon; 