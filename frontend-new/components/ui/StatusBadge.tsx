'use client'

import React from 'react'

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'critical'

interface StatusBadgeProps {
  status: string
  variant?: BadgeVariant
  pulse?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function StatusBadge({
  status,
  variant,
  pulse = false,
  className = '',
  size = 'md'
}: StatusBadgeProps) {
  // Infer variant if not explicitly passed
  const getVariant = (): BadgeVariant => {
    if (variant) return variant
    const s = status.toLowerCase()
    if (s.includes('active') || s.includes('optimal') || s.includes('on schedule') || s.includes('in stock') || s.includes('online') || s.includes('connected') || s.includes('completed') || s.includes('auto-approved') || s.includes('enabled')) {
      return 'success'
    }
    if (s.includes('at risk') || s.includes('delayed') || s.includes('low stock') || s.includes('exposure') || s.includes('warning') || s.includes('eta slip')) {
      return 'warning'
    }
    if (s.includes('critical') || s.includes('stockout') || s.includes('failed') || s.includes('error') || s.includes('suspended')) {
      return 'danger'
    }
    if (s.includes('in transit') || s.includes('in_progress') || s.includes('ready') || s.includes('simulated')) {
      return 'info'
    }
    return 'neutral'
  }

  const v = getVariant()

  const variantStyles: Record<BadgeVariant, { bg: string; text: string; dot: string; border?: string }> = {
    success: { bg: 'bg-[#e8f8ed]', text: 'text-[#34c759]', dot: 'bg-[#34c759]', border: 'border-[#34c759]/20' },
    warning: { bg: 'bg-[#fff4e5]', text: 'text-[#ff9f0a]', dot: 'bg-[#ff9f0a]', border: 'border-[#ff9f0a]/20' },
    danger: { bg: 'bg-[#ffebe8]', text: 'text-[#ff3b30]', dot: 'bg-[#ff3b30]', border: 'border-[#ff3b30]/20' },
    critical: { bg: 'bg-[#ffebe8]', text: 'text-[#ff3b30]', dot: 'bg-[#ff3b30]', border: 'border-[#ff3b30]/30' },
    info: { bg: 'bg-[#e8f0fe]', text: 'text-[#087ef5]', dot: 'bg-[#087ef5]', border: 'border-[#087ef5]/20' },
    neutral: { bg: 'bg-[#f1f1f3]', text: 'text-[#6e6e73]', dot: 'bg-[#86868b]', border: 'border-[#d2d2d7]/40' }
  }

  const style = variantStyles[v]
  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : size === 'lg' ? 'text-xs px-3 py-1.5' : 'flow-badge'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider transition-all border max-w-full min-w-0 overflow-hidden ${style.bg} ${style.text} ${style.border} ${sizeClass} ${className}`}>
      <span className={`size-1.5 rounded-full shrink-0 ${style.dot} ${pulse ? 'animate-pulse' : ''}`} />
      <span className="truncate min-w-0">{status}</span>
    </span>
  )
}
