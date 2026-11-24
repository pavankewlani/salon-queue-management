import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ShieldCheck, Clock, PhoneCall } from 'lucide-react';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-onyx border-t border-charcoal-600 mt-auto py-8 px-4 sm:px-8 text-xs text-gray-400">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <div className="space-y-1">
          <p className="font-bold text-gray-200">
            {t('brand_name')} • {t('brand_tagline')}
          </p>
          <p className="flex items-center justify-center md:justify-start gap-1 text-[11px] text-gray-400">
            <Clock size={12} className="text-gold" />
            Hours: 09:00 AM - 09:00 PM | Online Queue closes at 08:30 PM (30m Cutoff)
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
          <span className="flex items-center gap-1 text-gray-400">
            <ShieldCheck size={13} className="text-gold" />
            FCFS Invariant & 10-Min No-Show Rule Active
          </span>
          <span className="flex items-center gap-1 text-gray-400">
            <PhoneCall size={13} className="text-gold" />
            Strict 1 Token / Phone Number
          </span>
        </div>

        <p className="text-[11px] text-gray-500">
          © {new Date().getFullYear()} Royal Touch Grooming. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
