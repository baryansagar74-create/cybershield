import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon,
  className,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-colors select-none rounded-input focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

  const sizeStyles = {
    sm: "text-xs px-2.5 py-1.5 gap-1.5 h-8",
    md: "text-sm px-3.5 py-2 gap-2 h-9",
    lg: "text-base px-4 py-2.5 gap-2.5 h-11",
  };

  const variantStyles = {
    primary: "bg-teal hover:bg-[#0e8c83] text-white border border-transparent shadow-sm",
    secondary: "bg-raised hover:bg-sunken text-txt border border-line",
    danger: "bg-risk-high hover:bg-[#c73338] text-white border border-transparent shadow-sm",
    ghost: "bg-transparent hover:bg-sunken text-txt border border-transparent",
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={clsx(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
};
