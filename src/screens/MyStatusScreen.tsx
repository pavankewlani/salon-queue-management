import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useQueue } from '../context/QueueContext';
import { useAuth } from '../context/AuthContext';
import { maskPhone, canViewCustomerDetails } from '../utils/privacy';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Clock,
  AlertCircle,
  Bell,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Scissors,
  MapPin,
  Sparkles,
  Ban
} from 'lucide-react';

export const MyStatusScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const { queue, cancelToken, getTokenPosition } = useQueue();
  const { user } = useAuth();

  const tokenId = (id || 'S-3').toUpperCase().replace('#', '');
  const token = queue.find((t) => t.id.toUpperCase() === tokenId);

  // Privacy evaluation: Is current viewer authorized to see unmasked details?
  const isAuthorizedViewer = token ? canViewCustomerDetails(user, token) : false;

  // Live Position Info
  const posInfo = getTokenPosition(tokenId);

  // Cancellation Confirmation Modal
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Auto-refresh interval (every 3.5s for <5s SLA)
  const [, setRefreshTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setRefreshTick((prev) => prev + 1), 3500);
    return () => clearInterval(timer);
  }, []);

  // Web Audio API Luxury Chime when called
  useEffect(() => {
    if (posInfo.isCalled && soundEnabled) {
      try {
        const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const playTone = (freq: number, start: number, duration: number) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, audioCtx.currentTime + start);
          gain.gain.setValueAtTime(0.15, audioCtx.currentTime + start);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + start + duration);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(audioCtx.currentTime + start);
          osc.stop(audioCtx.currentTime + start + duration);
        };
        // Luxury Two-Tone chime (C5 -> E5)
        playTone(523.25, 0, 0.4);
        playTone(659.25, 0.25, 0.6);
      } catch (e) {
        console.warn('AudioContext not allowed without gesture', e);
      }
    }
  }, [posInfo.isCalled, soundEnabled]);

  const handleConfirmCancel = () => {
    const result = cancelToken(tokenId);
    if (result.success) {
      setIsCancelModalOpen(false);
      setCancelError('');
    } else {
      setCancelError(result.error || 'Failed to cancel spot.');
    }
  };

  // If token is not found in queue
  if (!token) {
    return (
      <div className="max-w-md mx-auto space-y-6 text-center py-12 animate-fadeIn">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-950/80 border border-red-500/50 flex items-center justify-center text-red-400">
          <Ban size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-100">{t('token_not_found_title')}</h2>
          <p className="text-xs text-gray-400">{t('token_not_found_desc', { id: tokenId })}</p>
        </div>
        <Link to="/join">
          <Button size="md" className="gap-2">
            <Scissors size={16} />
            <span>{t('btn_join_new_token')}</span>
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-5 animate-fadeIn pb-12">
      {/* Back button */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gold transition-colors py-1"
      >
        <ArrowLeft size={14} />
        <span>Back to Home</span>
      </Link>

      <div className="text-center space-y-1">
        <Badge variant="gold" size="sm" pulse>Live Synchronized (&lt; 5s)</Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-100">
          {t('status_title')}
        </h1>
        <p className="text-xs text-gray-400 font-medium flex items-center justify-center gap-1.5 flex-wrap">
          <span>Patron:</span>
          <span className="text-gray-200 font-bold">{token.customerName}</span>
          <span className="font-mono">
            (+91 {isAuthorizedViewer ? token.customerPhone : maskPhone(token.customerPhone)})
          </span>
          {!isAuthorizedViewer && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/30">
              Privacy Protected Pass
            </span>
          )}
        </p>
      </div>

      <Card goldAccent className="text-center space-y-6">
        {/* Token Number Display (Sequential e.g. S-1, S-2) */}
        <div>
          <p className="text-[11px] uppercase tracking-widest text-gray-400 font-semibold mb-1">
            {t('token_number')}
          </p>
          <div className="inline-block px-8 py-3.5 rounded-2xl bg-charcoal-700 border-2 border-gold shadow-gold-glow">
            <span className="text-4xl sm:text-5xl font-black tracking-wider text-gold font-mono">
              #{token.id}
            </span>
          </div>
        </div>

        {/* 1. Condition: "It's your turn!" when called */}
        {posInfo.isCalled && (
          <div className="p-4 rounded-2xl bg-emerald-950/90 border-2 border-emerald-500 text-emerald-300 space-y-2 animate-bounce">
            <div className="flex items-center justify-center gap-2">
              <Sparkles size={20} className="text-emerald-400" />
              <span className="text-lg sm:text-xl font-black tracking-wide">
                {t('its_your_turn_title')}
              </span>
            </div>
            <p className="text-xs text-emerald-200 font-medium">
              {t('its_your_turn_desc', {
                chair: token.chairNumber || 1,
                barber: token.assignedBarberName || 'Stylist',
              })}
            </p>
            <div className="pt-1">
              <Badge variant="up_next" size="md">
                10-Minute Grace Timer Active
              </Badge>
            </div>
          </div>
        )}

        {/* 2. Condition: "Start coming" when second in line */}
        {posInfo.isSecondInLine && !posInfo.isCalled && (
          <div className="p-4 rounded-2xl bg-amber-950/90 border-2 border-amber-500 text-amber-200 space-y-1.5 shadow-gold-glow">
            <div className="flex items-center justify-center gap-2">
              <MapPin size={20} className="text-amber-400 animate-pulse" />
              <span className="text-base sm:text-lg font-black tracking-wide">
                {t('start_coming_title')}
              </span>
            </div>
            <p className="text-xs text-amber-300">
              {t('start_coming_desc')}
            </p>
          </div>
        )}

        {/* 3. Condition: First in line / Up Next */}
        {posInfo.isUpNext && !posInfo.isCalled && (
          <div className="p-3.5 rounded-xl bg-amber-900/60 border border-amber-500/50 text-amber-300 flex items-center justify-center gap-2">
            <Clock size={18} className="animate-pulse" />
            <span className="font-bold text-sm sm:text-base">
              {t('status_up_next')}
            </span>
          </div>
        )}

        {/* 4. Condition: In Service */}
        {posInfo.isInService && (
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 flex items-center justify-center gap-2">
            <Scissors size={18} className="text-emerald-400" />
            <span className="font-bold text-sm sm:text-base">
              {t('status_in_service')} — Chair {token.chairNumber} ({token.assignedBarberName})
            </span>
          </div>
        )}

        {/* 5. Condition: Terminal States (Cancelled / No-show / Completed) */}
        {token.status === 'CANCELLED' && (
          <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-600/50 text-red-300 text-xs">
            <p className="font-bold text-sm">{t('status_cancelled')}</p>
            <p className="mt-0.5">This queue spot was forfeited. Rejoining will issue a new token.</p>
          </div>
        )}

        {token.status === 'NO_SHOW' && (
          <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-600/50 text-red-300 text-xs">
            <p className="font-bold text-sm">{t('status_no_show')}</p>
            <p className="mt-0.5">Customer failed to report within 10 minutes of being called.</p>
          </div>
        )}

        {token.status === 'COMPLETED' && (
          <div className="p-3.5 rounded-xl bg-charcoal-700 border border-charcoal-500 text-gray-200 text-xs">
            <p className="font-bold text-sm text-emerald-400">{t('status_completed')}</p>
            <p className="mt-0.5">Thank you for visiting Royal Touch Grooming!</p>
          </div>
        )}

        {/* Live Position & Dynamic Wait Time Grid */}
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="p-4 rounded-xl bg-charcoal-700 border border-charcoal-600">
            <p className="text-xs text-gray-400 uppercase font-semibold">{t('queue_position')}</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-gold mt-1 font-mono">
              {posInfo.position > 0 ? `${posInfo.position}${posInfo.position === 1 ? 'st' : posInfo.position === 2 ? 'nd' : posInfo.position === 3 ? 'rd' : 'th'}` : '—'}
            </p>
            <p className="text-[11px] text-gray-400">
              {posInfo.aheadCount > 0 ? `${posInfo.aheadCount} patrons ahead` : 'Next in line'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-charcoal-700 border border-charcoal-600">
            <p className="text-xs text-gray-400 uppercase font-semibold">{t('avg_wait_time')}</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1 font-mono">
              ~{posInfo.estimatedWaitMinutes} {t('mins_short')}
            </p>
            <p className="text-[11px] text-gray-400">
              Live calculated
            </p>
          </div>
        </div>

        {/* Stylist & Services Breakdown */}
        <div className="text-left space-y-3 p-4 rounded-xl bg-charcoal-700/60 border border-charcoal-600">
          <div className="flex items-center justify-between pb-2 border-b border-charcoal-600 text-xs">
            <span className="text-gray-400 font-semibold">{t('assigned_barber')}:</span>
            <span className="font-bold text-gold">
              {token.assignedBarberName || 'Any Available Stylist (Fastest)'}
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            {token.services.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-gray-300">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-gold" />
                  {language === 'gu' ? s.nameGu : s.nameEn} ({s.durationMinutes}m)
                </span>
                <span className="font-mono text-gray-200">₹{s.priceInr}</span>
              </div>
            ))}

            <div className="flex items-center justify-between text-gray-200 font-bold pt-2 border-t border-charcoal-600/50">
              <span>
                Total Duration: {token.services.reduce((acc, s) => acc + s.durationMinutes, 0)} Mins
              </span>
              <span className="text-emerald-400 font-mono">
                Total: ₹{token.services.reduce((acc, s) => acc + s.priceInr, 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Audio chime toggle */}
        <div className="pt-1">
          <label className="flex items-center justify-center gap-2 text-xs text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="accent-gold rounded"
            />
            <Bell size={14} className={soundEnabled ? 'text-gold' : 'text-gray-500'} />
            <span>{t('sound_alert_toggle')}</span>
          </label>
        </div>

        {/* Cancel Spot Button (with Invariant & Restrictions) */}
        <div className="pt-2">
          {posInfo.isInService ? (
            <div className="p-3 rounded-xl bg-charcoal-700/60 border border-charcoal-600 text-xs text-gray-400">
              <span className="flex items-center justify-center gap-1.5">
                <Scissors size={14} className="text-gold" />
                <span>{t('cancel_in_service_blocked')}</span>
              </span>
            </div>
          ) : posInfo.isTerminal ? (
            <Link to="/join">
              <Button size="md" fullWidth className="gap-2">
                <Scissors size={16} />
                <span>{t('btn_join_new_token')}</span>
              </Button>
            </Link>
          ) : (
            <Button
              variant="danger"
              size="md"
              fullWidth
              onClick={() => setIsCancelModalOpen(true)}
              className="gap-2"
            >
              <span>{t('btn_cancel_spot')}</span>
            </Button>
          )}
        </div>
      </Card>

      {/* Cancellation Confirmation Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-onyx rounded-2xl border-2 border-red-500/60 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle size={24} />
              <h3 className="font-bold text-lg text-gray-100">
                {t('cancel_confirm_title')}
              </h3>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              {t('cancel_confirm_desc', { id: token.id })}
            </p>

            {cancelError && (
              <p className="text-xs text-red-400 flex items-center gap-1.5">
                <AlertCircle size={14} />
                <span>{cancelError}</span>
              </p>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  setIsCancelModalOpen(false);
                  setCancelError('');
                }}
              >
                {t('cancel_dismiss_btn')}
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handleConfirmCancel}
              >
                {t('cancel_confirm_btn')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
