'use client';

import React from 'react';
import { createLucideIcon, LucideProps } from 'lucide-react';

interface IconProps extends Omit<LucideProps, 'size'> {
  name: string;
  size?: number | string;
  className?: string;
  animated?: boolean;
  animationType?: 'pulse' | 'spin' | 'bounce' | 'float';
}

const iconCache = new Map<string, React.FC<LucideProps>>();

function getIconComponent(name: string): React.FC<LucideProps> | null {
  if (iconCache.has(name)) {
    return iconCache.get(name)!;
  }
  
  try {
    const IconComponent = createLucideIcon(name, []);
    iconCache.set(name, IconComponent);
    return IconComponent;
  } catch {
    return null;
  }
}

const animationStyles = {
  pulse: 'animate-pulse-soft',
  spin: 'animate-spin',
  bounce: 'animate-bounce',
  float: 'animate-float',
};

export function Icon({ name, size = 20, className = '', animated = false, animationType = 'pulse', ...props }: IconProps) {
  const IconComponent = getIconComponent(name);
  
  if (!IconComponent) {
    return (
      <span 
        className={`inline-flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 9h6v6H9z" />
        </svg>
      </span>
    );
  }
  
  return (
    <IconComponent
      size={size}
      className={`${className} ${animated ? animationStyles[animationType] : ''}`}
      {...props}
    />
  );
}

export function createIcon(name: string): React.FC<Omit<IconProps, 'name'>> {
  return function SpecificIcon(props: Omit<IconProps, 'name'>) {
    return <Icon name={name} {...props} />;
  };
}