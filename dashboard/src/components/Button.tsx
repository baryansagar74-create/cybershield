import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'glossy_cyan' | 'glossy_pink' | 'glossy_glass';
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
  const baseStyles = "glossy-btn inline-flex items-center justify-center font-semibold transition-all duration-200 select-none rounded-[14px] focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.96] cursor-pointer";

  const sizeStyles = {
    sm: "text-xs px-3 py-1.5 gap-1.5 h-8",
    md: "text-xs px-4 py-2 gap-2 h-9",
    lg: "text-sm px-5 py-2.5 gap-2.5 h-11",
  };

  const variantStyles = {
    primary: "bg-gradient-to-r from-[#12D8C4] to-[#0FA79B] text-[#032622] font-bold shadow-[0_8px_24px_rgba(18,216,196,0.45),inset_0_1px_0_rgba(255,255,255,0.7)] hover:shadow-[0_10px_28px_rgba(18,216,196,0.6)] hover:scale-[1.02]",
    secondary: "bg-white/10 hover:bg-white/15 text-[#EAF1FF] border border-white/20 shadow-[0_8px_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.3)] hover:scale-[1.02]",
    danger: "bg-gradient-to-r from-[#FF8FB1] via-[#FF3D8B] to-[#FF9F2E] text-[#3A0618] font-bold shadow-[0_10px_30px_rgba(255,61,139,0.55),inset_0_1px_0_rgba(255,255,255,0.7)] hover:shadow-[0_12px_36px_rgba(255,61,139,0.7)] hover:scale-[1.02]",
    ghost: "bg-transparent hover:bg-white/10 text-[#C9D6F5] border border-transparent hover:border-white/15",
    glossy_cyan: "bg-gradient-to-r from-[#34F0DB] to-[#0FA79B] text-[#032622] font-bold shadow-[0_8px_24px_rgba(18,216,196,0.5),inset_0_1px_0_rgba(255,255,255,0.8)]",
    glossy_pink: "bg-gradient-to-r from-[#FF5C7C] to-[#B8123A] text-white font-bold shadow-[0_8px_24px_rgba(255,61,100,0.6),inset_0_1px_0_rgba(255,255,255,0.6)]",
    glossy_glass: "bg-gradient-to-b from-white/20 to-white/5 border border-white/30 text-[#EAF1FF] shadow-[0_8px_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.5)]",
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
