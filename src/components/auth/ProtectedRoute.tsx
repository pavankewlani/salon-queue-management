import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { ShieldAlert, Lock, ArrowRight, Home } from 'lucide-react';
import { Button } from '../ui/Button';
import { Link } from 'react-router-dom';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const { t, language } = useLanguage();

  const isRoleAuthorized = user && allowedRoles.includes(user.role);

  if (isRoleAuthorized) {
    return <>{children}</>;
  }

  const isAdminOnly = allowedRoles.length === 1 && allowedRoles[0] === 'admin';

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-10 px-4">
      <div className="max-w-md w-full bg-charcoal-800 border-2 border-charcoal-600 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl animate-fadeIn">
        {/* Shield Icon */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-500/20 to-gold/20 border-2 border-gold/40 flex items-center justify-center text-gold shadow-gold-glow">
          {isAdminOnly ? <Lock size={32} /> : <ShieldAlert size={32} />}
        </div>

        {/* Heading & Notice */}
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-gold/10 text-gold border border-gold/30">
            {isAdminOnly ? 'Restricted Admin Console' : 'Staff Access Only'}
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-gray-100">
            {language === 'gu' ? 'પ્રવેશ પ્રતિબંધિત છે' : 'Access Restricted'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-400">
            {isAdminOnly
              ? language === 'gu'
                ? 'સલૂન માલિક અને એડમિન માટે આ પેનલ સુરક્ષિત છે. પ્રવેશવા માટે કૃપા કરીને એડમિન તરીકે લોગ ઇન કરો.'
                : 'This panel contains sensitive salon operational settings and financial metrics. Please sign in as Owner/Admin to proceed.'
              : language === 'gu'
              ? 'સમગ્ર કતાર ફક્ત અધિકૃત સ્ટાફ (રિસેપ્શનિસ્ટ/બાર્બર) જ જોઈ શકે છે. કૃપા કરીને સ્ટાફ એકાઉન્ટથી લોગ ઇન કરો.'
              : 'The full customer queue and desk actions are reserved for salon personnel. Please sign in with staff credentials.'}
          </p>
        </div>

        {/* Current State Info */}
        {isAuthenticated && user && (
          <div className="p-3 rounded-xl bg-onyx border border-charcoal-600 text-xs text-gray-300 flex items-center justify-between">
            <span className="text-gray-400">Current Session:</span>
            <span className="font-bold text-amber-400 capitalize">
              {user.avatar} {user.name} ({user.role})
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <Button
            variant="primary"
            className="w-full justify-center gap-2"
            onClick={() => openAuthModal('login')}
          >
            <span>{isAdminOnly ? 'Sign In as Owner / Admin' : 'Sign In with Staff Account'}</span>
            <ArrowRight size={16} />
          </Button>

          <Link to="/" className="block">
            <Button variant="ghost" className="w-full justify-center gap-2 text-xs text-gray-400 hover:text-white">
              <Home size={14} />
              <span>{t('nav_home')}</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
