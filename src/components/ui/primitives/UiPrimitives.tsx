'use client'

import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import styles from './UiPrimitives.module.css'

type SurfaceTone = 'panel' | 'dialog' | 'banner' | 'sheet'
type ButtonTone = 'primary' | 'secondary' | 'ghost'
type ButtonShape = 'rounded' | 'pill'

const surfaceToneClass: Record<SurfaceTone, string> = {
  panel: '',
  dialog: styles.surfaceDialog,
  banner: styles.surfaceBanner,
  sheet: styles.surfaceSheet,
}

const buttonToneClass: Record<ButtonTone, string> = {
  primary: styles.buttonPrimary,
  secondary: styles.buttonSecondary,
  ghost: styles.buttonGhost,
}

const buttonShapeClass: Record<ButtonShape, string> = {
  rounded: styles.buttonRounded,
  pill: styles.buttonPill,
}

interface UISurfaceProps extends HTMLAttributes<HTMLDivElement> {
  tone?: SurfaceTone
}

interface UIOverlayProps extends HTMLAttributes<HTMLDivElement> {}

interface UIButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: ButtonTone
  shape?: ButtonShape
}

export const UIOverlay = forwardRef<HTMLDivElement, UIOverlayProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn(styles.overlay, className)} {...props} />
))

UIOverlay.displayName = 'UIOverlay'

export const UISurface = forwardRef<HTMLDivElement, UISurfaceProps>(
  ({ tone = 'panel', className, ...props }, ref) => (
    <div ref={ref} className={cn(styles.surface, surfaceToneClass[tone], className)} {...props} />
  )
)

UISurface.displayName = 'UISurface'

export const UIButton = forwardRef<HTMLButtonElement, UIButtonProps>(
  ({ tone = 'secondary', shape = 'rounded', className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(styles.button, buttonToneClass[tone], buttonShapeClass[shape], className)}
      {...props}
    />
  )
)

UIButton.displayName = 'UIButton'
