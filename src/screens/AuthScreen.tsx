import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { UserRole } from '../types';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Lock,
  Mail,
  User,
  Phone,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Scissors,
  Home,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const AuthScreen: React.FC = () => {
  const { login, signup, isAuthenticated, user, logout } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // If URL is /signup, default to signup tab, otherwise login
  const isInitialSignup = location.pathname.includes('signup');
  const [mode, setMode] = useState<'login' | 'signup'>(isInitialSignup ? 'signup' : 'login');

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

  const redirectAfterAuth = (role: UserRole) => {
    if (role === 'admin') {
      navigate('/admin');
    } else if (role === 'receptionist') {
      navigate('/reception');
    } else if (role === 'barber') {
      navigate('/barber/Amit');
    } else {
      navigate('/');
    }
  };

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

    if (res.success && res.user) {
      redirectAfterAuth(res.user.role);
    } else {
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

    if (res.success && res.user) {
      redirectAfterAuth(res.user.role);
    } else {
      setSignupError(res.error || 'Registration failed.');
    }
  };

  // If already logged in, show user profile card and quick redirects
  if (isAuthenticated && user) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 animate-fadeIn">
        <div className="bg-charcoal-800 border-2 border-gold/40 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-gold-light via-gold to-gold-dark flex items-center justify-center text-3xl shadow-gold-glow">
            {user.avatar || '👤'}
          </div>

          <div className="space-y-1">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gold/10 text-gold border border-gold/30">
              Active Session • {user.role.toUpperCase()}
            </span>
            <h2 className="text-2xl font-black text-gray-100">{user.name}</h2>
            <p className="text-xs text-gray-400">{user.email} {user.phone ? `• +91 ${user.phone}` : ''}</p>
          </div>

          <div className="p-4 rounded-2xl bg-onyx border border-charcoal-600 text-left space-y-2 text-xs">
            <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Access Privileges:</p>
            {user.role === 'admin' && (
              <p className="text-emerald-400 font-medium">✓ Unlocked: Admin Settings, Full Salon Analytics, & Queue Control</p>
            )}
            {user.role === 'receptionist' && (
              <p className="text-emerald-400 font-medium">✓ Unlocked: Reception Desk, Walk-In Intake, & Chair Dispatch</p>
            )}
            {user.role === 'barber' && (
              <p className="text-emerald-400 font-medium">✓ Unlocked: Stylist Tablet Chair View & Service Timer</p>
            )}
            {user.role === 'customer' && (
              <p className="text-emerald-400 font-medium">✓ Privacy Protected: Accessing private digital pass only (Admin panel hidden)</p>
            )}
          </div>

          <div className="space-y-3 pt-2">
            {user.role === 'admin' && (
              <Button variant="primary" className="w-full justify-center gap-2" onClick={() => navigate('/admin')}>
                <span>Go to Admin Panel</span>
                <ArrowRight size={16} />
              </Button>
            )}
            {user.role === 'receptionist' && (
              <Button variant="primary" className="w-full justify-center gap-2" onClick={() => navigate('/reception')}>
                <span>Go to Reception Desk</span>
                <ArrowRight size={16} />
              </Button>
            )}
            {user.role === 'customer' && (
              <Button variant="primary" className="w-full justify-center gap-2" onClick={() => navigate('/join')}>
                <span>Join Queue Now</span>
                <ArrowRight size={16} />
              </Button>
            )}

            <Button variant="secondary" className="w-full justify-center" onClick={logout}>
              Sign Out from Account
            </Button>

            <Link to="/" className="block">
              <Button variant="ghost" className="w-full justify-center gap-2 text-xs text-gray-400 hover:text-white">
                <Home size={14} />
                <span>Return to Home</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-8 px-4 animate-fadeIn">
      <div className="bg-charcoal-800 border-2 border-charcoal-600 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-gold-light via-gold to-gold-dark flex items-center justify-center text-onyx shadow-gold-glow">
            <Scissors size={24} className="stroke-[2.5]" />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-bold uppercase tracking-wider">
            <Sparkles size={13} />
            <span>Royal Touch Grooming Security</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-100">
            {mode === 'login'
              ? language === 'gu'
                ? 'સલૂન પોર્ટલમાં લોગ ઇન કરો'
                : 'Sign In to Your Account'
              : language === 'gu'
              ? 'નવું એકાઉન્ટ બનાવો'
              : 'Create Customer Account'}
          </h1>
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

        {/* Tab switch */}
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

        {/* Login Form */}
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

        {/* Signup Form */}
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

        {/* Footer Privacy Guarantee */}
        <div className="pt-2 border-t border-charcoal-700 text-center text-[11px] text-gray-400 flex items-center justify-center gap-1.5">
          <ShieldCheck size={13} className="text-gold" />
          <span>Strict Role-Based Privacy: Patrons cannot see other users' queue data.</span>
        </div>
      </div>
    </div>
  );
};
