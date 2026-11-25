import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const { toggleTheme, isDark } = useTheme();
  const { language } = useLanguage();

  const labelText = isDark
    ? language === 'gu'
      ? 'લાઈટ મોડ'
      : 'Light Mode'
    : language === 'gu'
    ? 'ડાર્ક મોડ'
    : 'Dark Mode';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 border ${
        isDark
          ? 'bg-charcoal-800 text-amber-300 border-charcoal-600 hover:border-gold hover:bg-gold/10'
          : 'bg-white text-charcoal-800 border-gray-300 hover:border-gold hover:bg-amber-50 shadow-sm'
      } ${className}`}
      title={labelText}
      aria-label="Toggle Theme Mode"
    >
      {isDark ? (
        <Sun size={15} className="text-amber-400 stroke-[2.2] animate-spin-slow" />
      ) : (
        <Moon size={15} className="text-indigo-600 stroke-[2.2]" />
      )}
      {showLabel && <span>{labelText}</span>}
    </button>
  );
};
