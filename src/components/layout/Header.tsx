import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { LanguageToggle } from '../ui/LanguageToggle';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Scissors, Sparkles, User, LogOut } from 'lucide-react';
import { isSupabaseConfigured, checkSupabaseConnection, SupabaseConnectionStatus } from '../../lib/supabase';

export const Header: React.FC = () => {
  const { t, language } = useLanguage();
  const location = useLocation();
  const { user, isAuthenticated, isAdmin, isStaff, logout, openAuthModal } = useAuth();
  const [dbStatus, setDbStatus] = useState<SupabaseConnectionStatus | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    checkSupabaseConnection().then(setDbStatus);
  }, []);

  // Role-based navigation filtering:
  // - Admin screen (/admin): ONLY visible if isAdmin
  // - Reception screen (/reception): ONLY visible if isStaff (Admin or Receptionist)
  // - Barber screen (/barber): ONLY visible if isStaff
  // - General patrons & guests only see Home, Join Queue, My Status, and Lobby TV
  const navLinks = [
    { to: '/', label: t('nav_home'), visible: true },
    { to: '/join', label: t('nav_join'), visible: true },
    { to: '/status/S-1', label: t('nav_status'), visible: true },
    { to: '/reception', label: t('nav_reception'), visible: Boolean(isStaff) },
    { to: '/barber/Amit', label: t('nav_barber'), visible: Boolean(isStaff) },
    { to: '/display', label: t('nav_display'), visible: true },
    { to: '/admin', label: t('nav_admin'), visible: Boolean(isAdmin) },
  ].filter((link) => link.visible);

  return (
    <header className="sticky top-0 z-50 bg-onyx/90 backdrop-blur-md border-b border-charcoal-600 px-3 sm:px-6 py-2.5">
      <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-2.5 lg:gap-4">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-light via-gold to-gold-dark flex items-center justify-center text-onyx shadow-gold-glow group-hover:scale-105 transition-transform shrink-0">
            <Scissors size={18} className="stroke-[2.5]" />
          </div>
          <div className="whitespace-nowrap">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-gray-100 group-hover:text-gold transition-colors">
                {t('brand_name')}
              </span>
              <Sparkles size={13} className="text-gold shrink-0" />
            </div>
            <p className="text-[10px] text-gray-400 font-medium leading-tight">
              {t('brand_tagline')}
            </p>
          </div>
        </Link>

        {/* Navigation Bar */}
        <nav className="flex items-center flex-wrap xl:flex-nowrap justify-center gap-1">
          {navLinks.map((link) => {
            const isActive =
              location.pathname === link.to ||
              (link.to.startsWith('/status') && location.pathname.startsWith('/status')) ||
              (link.to.startsWith('/barber') && location.pathname.startsWith('/barber')) ||
              (link.to.startsWith('/admin') && (location.pathname === '/admin' || location.pathname === '/owner'));

            return (
              <Link
                key={link.to}
                to={link.to}
                className={`whitespace-nowrap px-2.5 py-1.5 text-xs xl:text-[13px] font-semibold rounded-lg transition-all ${
                  isActive
                    ? 'bg-gold text-onyx shadow-sm'
                    : 'text-gray-300 hover:text-white hover:bg-charcoal-600'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Utility: Status + Auth Section + Language Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Cloud Database Indicator */}
          {dbStatus && (
            <div
              className={`hidden sm:flex items-center gap-1.5 whitespace-nowrap text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all ${
                dbStatus.isConnected
                  ? 'bg-emerald-950/70 text-emerald-300 border-emerald-600/50'
                  : dbStatus.isConfigured
                  ? 'bg-amber-950/70 text-amber-300 border-amber-600/50 cursor-pointer'
                  : 'bg-charcoal-800 text-gray-400 border-charcoal-600'
              }`}
              title={
                dbStatus.isConnected
                  ? `Connected to Supabase Cloud (${dbStatus.url})`
                  : dbStatus.isConfigured
                  ? `Supabase Configured: ${dbStatus.error || 'Needs Table Grant'}`
                  : 'Running in Local Storage Mode'
              }
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  dbStatus.isConnected
                    ? 'bg-emerald-400 animate-pulse'
                    : dbStatus.isConfigured
                    ? 'bg-amber-400 animate-bounce'
                    : 'bg-gray-500'
                }`}
              />
              <span>
                {dbStatus.isConnected
                  ? 'Cloud DB Live'
                  : dbStatus.isConfigured
                  ? 'DB Setup Required'
                  : 'Local Storage'}
              </span>
            </div>
          )}

          <div className="hidden 2xl:flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-700/50">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            {t('salon_status_open')}
          </div>

          {/* User Authentication Badge */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-1.5 bg-charcoal-800 border border-charcoal-600 rounded-xl px-2.5 py-1 whitespace-nowrap">
              <Link
                to="/login"
                className="flex items-center gap-1.5 text-xs text-gray-200 hover:text-gold transition-colors"
                title={`Logged in as ${user.name} (${user.role})`}
              >
                <span className="text-sm">{user.avatar || '👤'}</span>
                <span className="font-bold max-w-[80px] sm:max-w-[100px] truncate">
                  {user.name.split(' ')[0]}
                </span>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/30">
                  {user.role}
                </span>
              </Link>
              <button
                onClick={logout}
                className="p-1 rounded-lg text-gray-400 hover:text-red-400 hover:bg-charcoal-700 transition-colors ml-0.5"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 text-xs font-bold rounded-xl bg-gold/10 hover:bg-gold/20 text-gold border border-gold/40 hover:border-gold transition-all"
            >
              <User size={14} />
              <span>{language === 'gu' ? 'સાઇન ઇન' : 'Sign In'}</span>
            </button>
          )}

          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
