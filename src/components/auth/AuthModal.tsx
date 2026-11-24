import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { UserRole } from '../../types';
import {
  X,
  Lock,
  Mail,
  User,
  Phone,
  ShieldCheck,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Button } from '../ui/Button';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalMode,
    closeAuthModal,
    login,
    signup,
  } = useAuth();
  const { language } = useLanguage();

  const [mode, setMode] = useState<'login' | 'signup'>(authModalMode);

  // Sync mode with context
  React.useEffect(() => {
    setMode(authModalMode);
  }, [authModalMode]);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState<UserRole>('customer');
  const [signupError, setSignupError] = useState('');

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginIdentifier.trim()) {
      setLoginError(
        language === 'gu'
          ? 'કૃપા કરીને તમારો ઈમેલ અથવા 10-અંકનો ફોન નંબર દાખલ કરો.'
          : 'Please enter your email address or 10-digit phone number.'
      );
      return;
    }
    if (!loginPassword) {
      setLoginError(
        language === 'gu' ? 'કૃપા કરીને પાસવર્ડ દાખલ કરો.' : 'Please enter your password.'
      );
      return;
    }

    setIsSubmitting(true);
    const res = await login({ emailOrPhone: loginIdentifier, password: loginPassword });
    setIsSubmitting(false);

    if (!res.success) {
      setLoginError(res.error || 'Authentication failed.');
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');

    setIsSubmitting(true);
    const res = await signup({
      name: signupName,
      phone: signupPhone,
      email: signupEmail,
      password: signupPassword,
      role: signupRole,
    });
    setIsSubmitting(false);

    if (!res.success) {
      setSignupError(res.error || 'Registration failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-onyx/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-lg bg-charcoal-800 border-2 border-charcoal-600 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-charcoal-700 transition-colors"
          aria-label="Close authentication modal"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-bold uppercase tracking-wider">
            <Sparkles size={13} />
            <span>Royal Touch Grooming Security</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-100">
            {mode === 'login'
              ? language === 'gu'
                ? 'સલૂન પોર્ટલમાં લોગ ઇન કરો'
                : 'Sign In to Your Account'
              : language === 'gu'
              ? 'નવું એકાઉન્ટ બનાવો'
              : 'Create Customer Account'}
          </h2>
          <p className="text-xs text-gray-400">
            {mode === 'login'
              ? language === 'gu'
                ? 'તમારો વ્યક્તિગત પાસ જોવા અથવા સ્ટાફ પેનલ ખોલવા માટે લોગ ઇન કરો.'
                : 'Access your private digital pass or staff queue coordination portal.'
              : language === 'gu'
              ? 'તમારી વિગતો સુરક્ષિત રહેશે અને અન્ય ગ્રાહકો તમારી માહિતી જોઈ શકશે નહીં.'
              : 'Your personal phone and queue details remain strictly private.'}
          </p>
        </div>

        {/* Mode Switch Tabs */}
        <div className="flex border-b border-charcoal-600">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setLoginError('');
              setSignupError('');
            }}
            className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-all ${
              mode === 'login'
                ? 'border-gold text-gold'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            {language === 'gu' ? 'લોગ ઇન (Sign In)' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setLoginError('');
              setSignupError('');
            }}
            className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-all ${
              mode === 'signup'
                ? 'border-gold text-gold'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            {language === 'gu' ? 'નવું ખાતું બનાવો (Sign Up)' : 'Create Account'}
          </button>
        </div>

        {/* 1. LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {loginError && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-600/50 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Mail size={13} className="text-gold" />
                <span>Email or 10-Digit Mobile Number</span>
              </label>
              <input
                type="text"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder="e.g. admin@royaltouch.com or 9825012345"
                className="w-full bg-onyx border border-charcoal-600 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-gold transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Lock size={13} className="text-gold" />
                <span>Password</span>
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-onyx border border-charcoal-600 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-gold transition-colors"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="w-full justify-center py-2.5 font-bold"
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In Securely'}
            </Button>
          </form>
        )}

        {/* 2. SIGNUP FORM */}
        {mode === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="space-y-3.5">
            {signupError && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-600/50 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{signupError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <User size={13} className="text-gold" />
                <span>Full Name</span>
              </label>
              <input
                type="text"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                placeholder="e.g. Rajesh Patel"
                className="w-full bg-onyx border border-charcoal-600 rounded-xl px-3.5 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-gold transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                  <Phone size={13} className="text-gold" />
                  <span>Mobile Number</span>
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="9825012345"
                  className="w-full bg-onyx border border-charcoal-600 rounded-xl px-3.5 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-gold transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                  <Mail size={13} className="text-gold" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="rajesh@example.com"
                  className="w-full bg-onyx border border-charcoal-600 rounded-xl px-3.5 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-gold transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Lock size={13} className="text-gold" />
                <span>Password (min. 6 characters)</span>
              </label>
              <input
                type="password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-onyx border border-charcoal-600 rounded-xl px-3.5 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-gold transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-gold" />
                <span>Account Role</span>
              </label>
              <select
                value={signupRole}
                onChange={(e) => setSignupRole(e.target.value as UserRole)}
                className="w-full bg-onyx border border-charcoal-600 rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-200 focus:outline-none focus:border-gold transition-colors"
              >
                <option value="customer">👤 Customer (Private Digital Pass)</option>
                <option value="receptionist">📋 Receptionist (Front Desk Coordinator)</option>
                <option value="barber">✂️ Stylist / Barber (Chair Station)</option>
                <option value="admin">👑 Owner / Admin (Full Salon Management)</option>
              </select>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="w-full justify-center py-2.5 font-bold mt-2"
            >
              {isSubmitting ? 'Registering...' : 'Create Account & Sign In'}
            </Button>
          </form>
        )}

        {/* Footer Invariant note */}
        <div className="pt-2 border-t border-charcoal-700 text-center text-[11px] text-gray-400 flex items-center justify-center gap-1.5">
          <ShieldCheck size={13} className="text-gold" />
          <span>Strict Role-Based Privacy: Patrons cannot see other users' queue data.</span>
        </div>
      </div>
    </div>
  );
};
