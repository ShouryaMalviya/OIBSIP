import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  onClick,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-full transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5 shadow-sm',
    md: 'text-sm px-5 py-2.5 gap-2 shadow-sm',
    lg: 'text-base px-7 py-3.5 gap-2.5 shadow-md',
  };

  const variantStyles = {
    primary: 'bg-[#00804C] text-white hover:bg-[#74C365] hover:text-[#001F3F] focus:ring-[#00804C] active:scale-[0.98]',
    accent: 'bg-[#DBE64C] text-[#001F3F] hover:bg-[#c9d538] focus:ring-[#DBE64C] active:scale-[0.98]',
    midnight: 'bg-[#001F3F] text-[#F6F7ED] hover:bg-[#1E488F] focus:ring-[#001F3F] active:scale-[0.98]',
    outline: 'border-2 border-[#001F3F] text-[#001F3F] hover:bg-[#001F3F] hover:text-[#F6F7ED] focus:ring-[#001F3F]',
    outlineWhite: 'border-2 border-[#F6F7ED] text-[#F6F7ED] hover:bg-[#F6F7ED] hover:text-[#001F3F] focus:ring-[#F6F7ED]',
    ghost: 'text-[#001F3F] hover:bg-black/5 focus:ring-[#001F3F]',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.primary} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {!loading && Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
      <span>{children}</span>
      {!loading && Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
    </button>
  );
};

export default Button;
