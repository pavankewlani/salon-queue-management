import React from 'react';

export type BadgeVariant = 
  | 'waiting' 
  | 'up_next' 
  | 'in_service' 
  | 'completed' 
  | 'no_show' 
  | 'cancelled' 
  | 'gold' 
  | 'default';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  size = 'md',
  pulse = false,
}) => {
  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  const variantStyles: Record<BadgeVariant, string> = {
    waiting: 'bg-charcoal-600 text-gray-300 border border-charcoal-500',
    up_next: 'bg-amber-900/60 text-amber-300 border border-amber-600/50',
    in_service: 'bg-emerald-900/60 text-emerald-300 border border-emerald-600/50',
    completed: 'bg-blue-900/60 text-blue-300 border border-blue-600/50',
    no_show: 'bg-red-900/60 text-red-300 border border-red-600/50',
    cancelled: 'bg-gray-800 text-gray-400 border border-gray-700',
    gold: 'bg-gold/20 text-gold border border-gold/40',
    default: 'bg-charcoal-600 text-gray-200 border border-charcoal-500',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${sizeStyles} ${variantStyles[variant]}`}>
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
        </span>
      )}
      {children}
    </span>
  );
};
