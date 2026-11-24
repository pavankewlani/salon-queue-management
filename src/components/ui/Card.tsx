import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  goldAccent?: boolean;
  hoverGlow?: boolean;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  goldAccent = false,
  hoverGlow = false,
  title,
  subtitle,
  headerAction,
}) => {
  return (
    <div
      className={`bg-onyx rounded-2xl border ${
        goldAccent ? 'border-gold/50 shadow-gold-glow' : 'border-charcoal-600'
      } ${
        hoverGlow ? 'transition-all duration-200 hover:border-gold/60 hover:shadow-gold-glow' : ''
      } p-5 sm:p-6 ${className}`}
    >
      {(title || subtitle || headerAction) && (
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-charcoal-600">
          <div>
            {title && <h3 className="text-lg font-bold text-gray-100">{title}</h3>}
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
