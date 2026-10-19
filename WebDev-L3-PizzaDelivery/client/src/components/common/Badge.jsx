import React from 'react';

export const Badge = ({ children, variant = 'default', size = 'sm', className = '' }) => {
  const baseStyles = 'inline-flex items-center font-bold uppercase tracking-wider rounded-full select-none';

  const sizeStyles = {
    xs: 'text-[10px] px-2 py-0.5 gap-1',
    sm: 'text-xs px-2.5 py-1 gap-1',
    md: 'text-xs px-3 py-1.5 gap-1.5',
  };

  const variantStyles = {
    default: 'bg-slate-100 text-[#001F3F] border border-slate-200',
    spring: 'bg-[#DBE64C] text-[#001F3F] font-extrabold',
    mantis: 'bg-[#74C365] text-[#001F3F] font-bold',
    bookGreen: 'bg-[#00804C] text-white',
    midnight: 'bg-[#001F3F] text-[#F6F7ED]',
    nuitBlanche: 'bg-[#1E488F] text-white',
    veg: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    spicy: 'bg-rose-100 text-rose-800 border border-rose-300',
    admin: 'bg-[#001F3F] text-[#DBE64C] border border-[#DBE64C]/30',
  };

  return (
    <span className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant] || variantStyles.default} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
