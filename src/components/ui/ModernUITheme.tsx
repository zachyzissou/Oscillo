// Modern UI Theme and Components
import { forwardRef, ReactNode, ButtonHTMLAttributes, HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import gsap from 'gsap'
import { useEffect, useRef } from 'react'

// Glass Panel Component
export const GlassPanel = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & {
  variant?: 'dark' | 'light' | 'neon'
  glow?: boolean
  children: ReactNode
}>(({ className, variant = 'dark', glow = false, children, ...props }, ref) => {
  const panelRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (panelRef.current && glow) {
      gsap.to(panelRef.current, {
        boxShadow: '0 0 30px rgba(0, 255, 255, 0.5)',
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      })
    }
  }, [glow])

  const variants = {
    dark: 'bg-black/40 border-white/10',
    light: 'bg-white/10 border-white/20',
    neon: 'bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-cyan-500/30'
  }

  return (
    <div
      ref={ref || panelRef}
      className={cn(
        'backdrop-blur-xl rounded-2xl border transition-all duration-300',
        'shadow-2xl hover:shadow-3xl',
        variants[variant],
        glow && 'animate-pulse-glow',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
GlassPanel.displayName = 'GlassPanel'

// Neon Button Component
export const NeonButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  glow?: boolean
  pulse?: boolean
}>(({ className, variant = 'primary', size = 'md', glow = true, pulse = false, children, ...props }, ref) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  
  useEffect(() => {
    if (!buttonRef.current) return
    
    const button = buttonRef.current
    
    // Hover animation
    const handleMouseEnter = () => {
      gsap.to(button, {
        scale: 1.05,
        duration: 0.2,
        ease: 'power2.out'
      })
    }
    
    const handleMouseLeave = () => {
      gsap.to(button, {
        scale: 1,
        duration: 0.2,
        ease: 'power2.out'
      })
    }
    
    const handleMouseDown = () => {
      gsap.to(button, {
        scale: 0.95,
        duration: 0.1
      })
    }
    
    const handleMouseUp = () => {
      gsap.to(button, {
        scale: 1.05,
        duration: 0.1,
        onComplete: () => {
          gsap.to(button, {
            scale: 1,
            duration: 0.2
          })
        }
      })
    }
    
    button.addEventListener('mouseenter', handleMouseEnter)
    button.addEventListener('mouseleave', handleMouseLeave)
    button.addEventListener('mousedown', handleMouseDown)
    button.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      button.removeEventListener('mouseenter', handleMouseEnter)
      button.removeEventListener('mouseleave', handleMouseLeave)
      button.removeEventListener('mousedown', handleMouseDown)
      button.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const variants = {
    primary: 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-cyan-500/50',
    secondary: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white shadow-purple-500/50',
    accent: 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white shadow-yellow-500/50',
    danger: 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 text-white shadow-red-500/50'
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  return (
    <button
      ref={ref || buttonRef}
      className={cn(
        'relative overflow-hidden rounded-lg font-medium transition-all duration-300',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        glow && 'shadow-lg hover:shadow-xl',
        pulse && 'animate-pulse',
        className
      )}
      {...props}
    >
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      
      {/* Button content */}
      <span className="relative z-10">{children}</span>
      
      {/* Glow effect */}
      {glow && (
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-cyan-500/50 to-blue-500/50 blur-xl opacity-50" />
      )}
    </button>
  )
})
NeonButton.displayName = 'NeonButton'

// Animated Slider Component
export const NeonSlider = forwardRef<HTMLInputElement, {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  unit?: string
  color?: string
  showValue?: boolean
}>(({ label, value, onChange, min = 0, max = 1, step = 0.01, unit = '', color = '#00ffff', showValue = true }, ref) => {
  const trackRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (!trackRef.current) return
    
    const percentage = ((value - min) / (max - min)) * 100
    
    gsap.to(trackRef.current, {
      background: `linear-gradient(to right, ${color} 0%, ${color} ${percentage}%, rgba(255,255,255,0.1) ${percentage}%, rgba(255,255,255,0.1) 100%)`,
      duration: 0.3,
      ease: 'power2.out'
    })
  }, [value, min, max, color])

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-white/80">{label}</label>
        {showValue && (
          <span className="text-sm font-mono text-cyan-400">
            {value.toFixed(2)}{unit}
          </span>
        )}
      </div>
      <div className="relative">
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-transparent appearance-none cursor-pointer slider-thumb"
          style={{
            background: 'transparent'
          }}
        />
        <div
          ref={trackRef}
          className="absolute inset-0 h-2 rounded-full pointer-events-none"
          style={{
            background: `linear-gradient(to right, ${color} 0%, ${color} 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.1) 100%)`
          }}
        />
      </div>
    </div>
  )
})
NeonSlider.displayName = 'NeonSlider'

// Toggle Switch Component
export const NeonToggle = forwardRef<HTMLInputElement, {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  color?: string
  disabled?: boolean
}>(({ label, checked, onChange, color = '#00ffff', disabled = false }, ref) => {
  const toggleRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (!toggleRef.current) return
    
    gsap.to(toggleRef.current, {
      x: checked ? 20 : 0,
      backgroundColor: checked ? color : '#666',
      duration: 0.3,
      ease: 'power2.inOut'
    })
  }, [checked, color])

  return (
    <label
      className={`flex items-center space-x-3 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
    >
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
      <div className="relative w-12 h-6 bg-white/10 rounded-full backdrop-blur-sm">
        <div
          ref={toggleRef}
          className="absolute top-1 left-1 w-4 h-4 rounded-full shadow-lg"
          style={{ backgroundColor: checked ? color : '#666' }}
        />
        {checked && (
          <div 
            className="absolute inset-0 rounded-full opacity-30"
            style={{ boxShadow: `0 0 10px ${color}` }}
          />
        )}
      </div>
      <span className="text-sm font-medium text-white/80">{label}</span>
    </label>
  )
})
NeonToggle.displayName = 'NeonToggle'

// Tooltip Component
export function Tooltip({ content, children }: { content: string; children: ReactNode }) {
  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-black/90 backdrop-blur-sm text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
        {content}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90" />
      </div>
    </div>
  )
}

// Add custom styles to globals.css
export const modernUIStyles = `
  /* Slider thumb styles */
  .slider-thumb::-webkit-slider-thumb {
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: linear-gradient(45deg, #00ffff, #0088ff);
    cursor: pointer;
    box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
    transition: all 0.2s ease;
  }
  
  .slider-thumb::-webkit-slider-thumb:hover {
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.8);
    transform: scale(1.1);
  }
  
  .slider-thumb::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: linear-gradient(45deg, #00ffff, #0088ff);
    cursor: pointer;
    box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
    transition: all 0.2s ease;
    border: none;
  }
  
  /* Glow animation */
  @keyframes pulse-glow {
    0%, 100% {
      box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
    }
    50% {
      box-shadow: 0 0 40px rgba(0, 255, 255, 0.8);
    }
  }
  
  .animate-pulse-glow {
    animation: pulse-glow 2s ease-in-out infinite;
  }
`
