import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Globe } from 'lucide-react';

export const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="inline-flex items-center bg-onyx border border-charcoal-600 rounded-xl p-1 shadow-sm">
      <div className="flex items-center px-2 text-gray-400">
        <Globe size={14} className="text-gold" />
      </div>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
          language === 'en'
            ? 'bg-gold text-onyx shadow-sm'
            : 'text-gray-300 hover:text-white'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage('gu')}
        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
          language === 'gu'
            ? 'bg-gold text-onyx shadow-sm'
            : 'text-gray-300 hover:text-white'
        }`}
      >
        ગુજરાતી
      </button>
    </div>
  );
};
