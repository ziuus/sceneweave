'use client';

import React, { InputHTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeStyles = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-3 text-base',
  lg: 'px-5 py-4 text-lg',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, size = 'md', className = '', id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    
    return (
      <motion.div className={`w-full ${className}`} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
        {label && (
          <motion.label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-secondary mb-2"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {label}
          </motion.label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
              {leftIcon}
            </div>
          )}
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <input
              ref={ref}
              id={inputId}
              className={`
                w-full ${sizeStyles[size]} rounded-xl bg-bg-tertiary border transition-all duration-200
                placeholder:text-text-muted
                focus:outline-none focus:ring-2 focus:ring-accent-primary/20
                ${error ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : 'border-bg-border focus:border-accent-primary'}
                ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''}
              `}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? errorId : helperText ? helperId : undefined}
              {...props}
            />
          </motion.div>
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <motion.p
            id={errorId}
            className="mt-1.5 text-sm text-red-400"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
          >
            {error}
          </motion.p>
        )}
        {helperText && !error && (
          <motion.p
            id={helperId}
            className="mt-1.5 text-sm text-text-muted"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {helperText}
          </motion.p>
        )}
      </motion.div>
    );
  }
);

Input.displayName = 'Input';