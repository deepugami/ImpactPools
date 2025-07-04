import React, { useState, useEffect, useRef, useCallback } from 'react'

/**
 * CursorEffects Component
 * Creates beautiful interactive animations that respond to cursor movements
 * - Floating particles that follow the cursor
 * - Ripple effects on click
 * - Dynamic gradient shifts
 * - Smooth trailing effects
 */
const CursorEffects = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [particles, setParticles] = useState([])
  const [ripples, setRipples] = useState([])
  const [isMouseMoving, setIsMouseMoving] = useState(false)
  const animationRef = useRef()
  const lastMouseMoveTime = useRef(Date.now())

  // Track mouse movement
  const handleMouseMove = useCallback((e) => {
    setMousePosition({ x: e.clientX, y: e.clientY })
    setIsMouseMoving(true)
    lastMouseMoveTime.current = Date.now()
    
    // Create trailing particles
    if (Math.random() > 0.7) { // 30% chance to create particle
      const newParticle = {
        id: Date.now() + Math.random(),
        x: e.clientX,
        y: e.clientY,
        life: 1,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 2,
        speedY: (Math.random() - 0.5) * 2,
        color: `hsl(${250 + Math.random() * 60}, 70%, ${60 + Math.random() * 30}%)` // Purple variations
      }
      
      setParticles(prev => [...prev.slice(-50), newParticle]) // Keep max 50 particles
    }
  }, [])

  // Create ripple on click
  const handleClick = useCallback((e) => {
    const newRipple = {
      id: Date.now(),
      x: e.clientX,
      y: e.clientY,
      size: 0,
      opacity: 1
    }
    
    setRipples(prev => [...prev, newRipple])
    
    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id))
    }, 1000)
  }, [])

  // Animation loop
  useEffect(() => {
    const animate = () => {
      // Check if mouse stopped moving
      if (Date.now() - lastMouseMoveTime.current > 100) {
        setIsMouseMoving(false)
      }

      // Update particles
      setParticles(prev => 
        prev.map(particle => ({
          ...particle,
          x: particle.x + particle.speedX,
          y: particle.y + particle.speedY,
          life: particle.life - 0.02,
          size: particle.size * 0.99
        })).filter(particle => particle.life > 0)
      )

      // Update ripples
      setRipples(prev => 
        prev.map(ripple => ({
          ...ripple,
          size: ripple.size + 8,
          opacity: ripple.opacity - 0.02
        })).filter(ripple => ripple.opacity > 0)
      )

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // Add event listeners
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('click', handleClick)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('click', handleClick)
    }
  }, [handleMouseMove, handleClick])

  return (
    <>
      {/* Dynamic Gradient Overlay - responds to cursor position */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, 
            rgba(168, 85, 247, 0.15) 0%, 
            rgba(168, 85, 247, 0.05) 40%, 
            transparent 70%)`,
          opacity: isMouseMoving ? 1 : 0.3
        }}
      />

      {/* Cursor Glow */}
      <div 
        className="fixed pointer-events-none z-10 transition-opacity duration-200"
        style={{
          left: mousePosition.x - 20,
          top: mousePosition.y - 20,
          width: 40,
          height: 40,
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.6) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(10px)',
          opacity: isMouseMoving ? 1 : 0
        }}
      />

      {/* Floating Particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="fixed pointer-events-none z-5"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            borderRadius: '50%',
            opacity: particle.life,
            transform: 'translate(-50%, -50%)',
            filter: 'blur(0.5px)',
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`
          }}
        />
      ))}

      {/* Click Ripples */}
      {ripples.map(ripple => (
        <div
          key={ripple.id}
          className="fixed pointer-events-none z-5"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            border: '2px solid rgba(168, 85, 247, 0.6)',
            borderRadius: '50%',
            opacity: ripple.opacity,
            transform: 'translate(-50%, -50%)',
            filter: 'blur(1px)'
          }}
        />
      ))}

      {/* Floating Orbs - Large ambient effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              left: `${20 + i * 30}%`,
              top: `${30 + i * 20}%`,
              width: `${100 + i * 50}px`,
              height: `${100 + i * 50}px`,
              background: `radial-gradient(circle, rgba(168, 85, 247, ${0.1 - i * 0.02}) 0%, transparent 70%)`,
              borderRadius: '50%',
              filter: 'blur(40px)',
              animation: `float-${i} ${15 + i * 5}s ease-in-out infinite alternate`,
              transform: `translate(${Math.sin(Date.now() * 0.001 + i) * 50}px, ${Math.cos(Date.now() * 0.001 + i) * 30}px)`
            }}
          />
        ))}
      </div>

      {/* Interactive Light Beams */}
      <div 
        className="fixed pointer-events-none z-1 transition-all duration-500"
        style={{
          background: `conic-gradient(from ${(mousePosition.x + mousePosition.y) * 0.1}deg at 50% 50%, 
            transparent 0deg, 
            rgba(168, 85, 247, 0.03) 45deg, 
            rgba(168, 85, 247, 0.08) 90deg, 
            rgba(168, 85, 247, 0.03) 135deg, 
            transparent 180deg)`,
          width: '200%',
          height: '200%',
          top: '-50%',
          left: '-50%',
          opacity: isMouseMoving ? 1 : 0.2,
          transform: `rotate(${mousePosition.x * 0.1}deg)`
        }}
      />

      {/* CSS Animations */}
      <style>{`
        @keyframes float-0 {
          from { transform: translateY(0px) translateX(0px); }
          to { transform: translateY(-20px) translateX(10px); }
        }
        @keyframes float-1 {
          from { transform: translateY(0px) translateX(0px); }
          to { transform: translateY(15px) translateX(-15px); }
        }
        @keyframes float-2 {
          from { transform: translateY(0px) translateX(0px); }
          to { transform: translateY(-10px) translateX(20px); }
        }
      `}</style>
    </>
  )
}

export default CursorEffects 