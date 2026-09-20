'use client';

import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'icon';
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
}

const variantStyles = {
  primary: 'bg-accent-primary text-white hover:bg-accent-primary/90 active:bg-accent-primary active:scale-[0.98] shadow-glow',
  secondary: 'bg-bg-tertiary text-text-primary border border-bg-border hover:bg-bg-tertiary/80 active:scale-[0.98]',
  ghost: 'bg-transparent text-text-secondary hover:bg-bg-tertiary hover:text-text-primary active:scale-[0.98]',
  danger: 'bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 active:scale-[0.98]',
  success: 'bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600/30 active:scale-[0.98]',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-5 py-2.5 text-base gap-2',
  lg: 'px-7 py-3.5 text-lg gap-2.5',
  xl: 'px-10 py-4 text-xl gap-3',
  icon: 'p-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', size = 'md', fullWidth = false, loading = false, leftIcon, rightIcon, className = '', disabled, ...props }, ref) => {
    const isDisabled = disabled || loading;
    
    return (
      <motion.button
        ref={ref}
        className={`
          inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary
          disabled:opacity-50 disabled:cursor-not-allowed ${sizeStyles[size]} ${variantStyles[variant]}
          ${fullWidth ? 'w-full' : ''} ${className}
        `}
        disabled={isDisabled}
        whileTap={{ scale: isDisabled ? 1 : 0.98 }}
        {...props}
      >
        {loading && (
          <motion.div
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="flex-shrink-0"
          >
            <Loader2 className="w-4 h-4" />
          </motion.div>
        )}
        {!loading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        <span className={loading ? 'opacity-0' : ''}>{children}</span>
        {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';