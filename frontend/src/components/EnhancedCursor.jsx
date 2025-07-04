import React, { useState, useEffect } from 'react'

/**
 * EnhancedCursor Component
 * Creates a beautiful custom cursor with trailing effects
 * Works alongside CursorEffects for maximum visual impact
 */
const EnhancedCursor = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [cursorVariant, setCursorVariant] = useState('default')
  const [isClicking, setIsClicking] = useState(false)

  useEffect(() => {
    const mouseMove = (e) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY
      })
    }

    const mouseDown = () => setIsClicking(true)
    const mouseUp = () => setIsClicking(false)

    // Detect hoverable elements
    const handleMouseEnter = () => setCursorVariant('hover')
    const handleMouseLeave = () => setCursorVariant('default')

    // Add listeners to interactive elements
    const interactiveElements = document.querySelectorAll('a, button, [role="button"], input, textarea, select')
    
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', handleMouseEnter)
      el.addEventListener('mouseleave', handleMouseLeave)
    })

    window.addEventListener('mousemove', mouseMove)
    window.addEventListener('mousedown', mouseDown)
    window.addEventListener('mouseup', mouseUp)

    return () => {
      window.removeEventListener('mousemove', mouseMove)
      window.removeEventListener('mousedown', mouseDown)
      window.removeEventListener('mouseup', mouseUp)
      
      interactiveElements.forEach(el => {
        el.removeEventListener('mouseenter', handleMouseEnter)
        el.removeEventListener('mouseleave', handleMouseLeave)
      })
    }
  }, [])

  const variants = {
    default: {
      x: mousePosition.x - 8,
      y: mousePosition.y - 8,
      scale: 1,
    },
    hover: {
      x: mousePosition.x - 16,
      y: mousePosition.y - 16,
      scale: 1.5,
    },
    click: {
      x: mousePosition.x - 12,
      y: mousePosition.y - 12,
      scale: 0.8,
    }
  }

  const currentVariant = isClicking ? 'click' : cursorVariant

  return (
    <>
      {/* Hide default cursor */}
      <style jsx global>{`
        * {
          cursor: none !important;
        }
      `}</style>

      {/* Main Cursor */}
      <div
        className="fixed top-0 left-0 pointer-events-none z-50 mix-blend-difference"
        style={{
          transform: `translate(${variants[currentVariant].x}px, ${variants[currentVariant].y}px) scale(${variants[currentVariant].scale})`,
          transition: 'transform 0.1s ease-out',
          width: '16px',
          height: '16px',
          backgroundColor: '#ffffff',
          borderRadius: '50%',
          border: '2px solid rgba(168, 85, 247, 0.8)',
          boxShadow: '0 0 20px rgba(168, 85, 247, 0.5)'
        }}
      />

      {/* Trailing Cursor */}
      <div
        className="fixed top-0 left-0 pointer-events-none z-40"
        style={{
          transform: `translate(${mousePosition.x - 4}px, ${mousePosition.y - 4}px)`,
          transition: 'transform 0.15s ease-out',
          width: '8px',
          height: '8px',
          backgroundColor: 'rgba(168, 85, 247, 0.6)',
          borderRadius: '50%',
          filter: 'blur(2px)'
        }}
      />

      {/* Secondary Trail */}
      <div
        className="fixed top-0 left-0 pointer-events-none z-30"
        style={{
          transform: `translate(${mousePosition.x - 2}px, ${mousePosition.y - 2}px)`,
          transition: 'transform 0.2s ease-out',
          width: '4px',
          height: '4px',
          backgroundColor: 'rgba(168, 85, 247, 0.3)',
          borderRadius: '50%',
          filter: 'blur(4px)'
        }}
      />
    </>
  )
}

export default EnhancedCursor 