'use client'
import React, { HTMLAttributes, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

// ============================================================================
// CORNER BRACKETS
// ============================================================================

interface CornerBracketsProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'top' | 'bottom' | 'both'
  children: React.ReactNode
}

export const CornerBrackets: React.FC<CornerBracketsProps> = ({
  variant = 'both',
  className,
  children,
  ...props
}) => {
  const topBrackets = variant === 'top' || variant === 'both'
  const bottomBrackets = variant === 'bottom' || variant === 'both'

  return (
    <div
      className={cn(
        topBrackets && 'corner-brackets',
        bottomBrackets && 'corner-brackets-bottom',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// ============================================================================
// TACTICAL PANEL
// ============================================================================

interface TacticalPanelProps extends HTMLAttributes<HTMLDivElement> {
  framed?: boolean
  scanlines?: boolean
  grid?: boolean
  children: React.ReactNode
}

export const TacticalPanel: React.FC<TacticalPanelProps> = ({
  framed = false,
  scanlines = false,
  grid = false,
  className,
  children,
  ...props
}) => {
  const content = (
    <div
      className={cn(
        'tactical-panel',
        framed && 'tactical-panel-framed',
        scanlines && 'scanlines',
        grid && 'tactical-grid',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )

  if (framed) {
    return <CornerBrackets>{content}</CornerBrackets>
  }

  return content
}

// ============================================================================
// STATUS INDICATOR
// ============================================================================

type StatusType = 'success' | 'warning' | 'error' | 'info' | 'active'

interface StatusIndicatorProps {
  status: StatusType
  label?: string
  className?: string
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  className
}) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className={cn('status-dot', status)} />
      {label && (
        <span className="tactical-text-mono text-xs text-secondary uppercase">
          {label}
        </span>
      )}
    </div>
  )
}

// ============================================================================
// METRIC DISPLAY
// ============================================================================

interface MetricDisplayProps {
  value: string | number
  label: string
  unit?: string
  color?: 'green' | 'cyan' | 'yellow' | 'red' | 'orange'
  className?: string
}

export const MetricDisplay: React.FC<MetricDisplayProps> = ({
  value,
  label,
  unit,
  color = 'cyan',
  className
}) => {
  const colorClass = {
    green: 'text-neon-green',
    cyan: 'text-neon-cyan',
    yellow: 'text-neon-yellow',
    red: 'text-neon-red',
    orange: 'text-[var(--neon-orange)]'
  }[color]

  return (
    <div className={cn('flex flex-col', className)}>
      <div className={cn('metric-value', colorClass)}>
        {value}
        {unit && <span className="text-sm ml-1">{unit}</span>}
      </div>
      <div className="metric-label">{label}</div>
    </div>
  )
}

// ============================================================================
// NEON DIVIDER
// ============================================================================

interface NeonDividerProps {
  vertical?: boolean
  className?: string
}

export const NeonDivider: React.FC<NeonDividerProps> = ({
  vertical = false,
  className
}) => {
  return (
    <div
      className={cn(
        vertical ? 'neon-line-vertical' : 'neon-line',
        className
      )}
    />
  )
}

// ============================================================================
// TACTICAL BUTTON
// ============================================================================

interface TacticalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'danger' | 'success'
  children: React.ReactNode
}

export const TacticalButton: React.FC<TacticalButtonProps> = ({
  variant = 'default',
  className,
  children,
  ...props
}) => {
  return (
    <button
      className={cn('tactical-button', variant, className)}
      {...props}
    >
      {children}
    </button>
  )
}

// ============================================================================
// TERMINAL TEXT
// ============================================================================

interface TerminalTextProps {
  children: React.ReactNode
  prompt?: boolean
  className?: string
}

export const TerminalText: React.FC<TerminalTextProps> = ({
  children,
  prompt = false,
  className
}) => {
  return (
    <div
      className={cn(
        'terminal-text',
        prompt && 'terminal-prompt',
        className
      )}
    >
      {children}
    </div>
  )
}

// ============================================================================
// TACTICAL PROGRESS BAR
// ============================================================================

interface TacticalProgressProps {
  value: number
  max?: number
  className?: string
}

export const TacticalProgress: React.FC<TacticalProgressProps> = ({
  value,
  max = 100,
  className
}) => {
  const percentage = Math.min((value / max) * 100, 100)

  return (
    <div className={cn('tactical-progress', className)}>
      <div
        className="tactical-progress-fill"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

// ============================================================================
// METRIC GRID (like Image #2's allocation display)
// ============================================================================

interface MetricGridProps {
  metrics: Array<{
    value: number
    label: string
    color?: 'green' | 'cyan' | 'yellow' | 'red'
  }>
  className?: string
}

export const MetricGrid: React.FC<MetricGridProps> = ({
  metrics,
  className
}) => {
  return (
    <div className={cn('flex gap-8', className)}>
      {metrics.map((metric, index) => (
        <MetricDisplay
          key={index}
          value={metric.value}
          label={metric.label}
          color={metric.color}
        />
      ))}
    </div>
  )
}
