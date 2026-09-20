'use client';

import React, { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassPanelProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  variant?: 'default' | 'strong' | 'subtle';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  border?: boolean;
  hover?: boolean;
  className?: string;
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
};

const radiusStyles = {
  none: 'rounded-none',
  sm: 'rounded-lg',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
  xl: 'rounded-3xl',
  '2xl': 'rounded-4xl',
  full: 'rounded-full',
};

const variantStyles = {
  default: 'glass',
  strong: 'glass-strong',
  subtle: 'bg-bg-tertiary/50 backdrop-blur-xl border-bg-border/30',
};

export const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ children, variant = 'default', padding = 'md', radius = 'lg', border = true, hover = false, className = '', style, ...props }, ref) => {
    const baseClass = `${variantStyles[variant]} ${paddingStyles[padding]} ${radiusStyles[radius]} ${border ? 'border' : ''} ${hover ? 'transition-all duration-300 hover:glass-hover' : ''}`;
    
    return (
      <motion.div
        ref={ref}
        className={`${baseClass} ${className}`}
        style={style}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassPanel.displayName = 'GlassPanel';