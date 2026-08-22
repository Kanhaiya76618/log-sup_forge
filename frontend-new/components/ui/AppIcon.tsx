'use client';

import React from 'react';
import * as LucideIcons from 'lucide-react';

interface AppIconProps {
  name: string;
  size?: number;
  className?: string;
}

export default function AppIcon({ name, size = 18, className = '' }: AppIconProps) {
  // Map standard icons to Lucide icons
  const iconMap: Record<string, keyof typeof LucideIcons> = {
    MapIcon: 'Map',
    XMarkIcon: 'X',
    TruckIcon: 'Truck',
    CheckCircleIcon: 'CheckCircle2',
    ExclamationTriangleIcon: 'AlertTriangle',
    SwatchIcon: 'Palette',
    SunIcon: 'Sun',
    MoonIcon: 'Moon',
    ComputerDesktopIcon: 'Monitor',
    BellIcon: 'Bell',
    EnvelopeIcon: 'Mail',
    DevicePhoneMobileIcon: 'Smartphone',
    ChatBubbleLeftRightIcon: 'MessageSquare',
    ChartBarIcon: 'BarChart3',
    ShieldCheckIcon: 'ShieldCheck',
  };

  const lucideName = iconMap[name] || (name as keyof typeof LucideIcons);
  const IconComponent = (LucideIcons[lucideName] as React.ComponentType<{ size?: number; className?: string }>) || LucideIcons.HelpCircle;

  return <IconComponent size={size} className={className} />;
}
