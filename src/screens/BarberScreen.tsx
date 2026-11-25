import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useQueue } from '../context/QueueContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Scissors,
  Clock,
  Coffee,
  CheckCircle2,
  AlertTriangle,
  Play,
  Check,
  UserCheck,
  Phone,
  AlertCircle,
  Sparkles
} from 'lucide-react';

export const BarberScreen: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const {
    barbers,
    queue,
    seatCustomer,
    completeService,
    callNextForBarber,
    markNoShow,
    toggleBarberBreak,
    isAutoAcceptActive,
    toggleAutoAccept,
  } = useQueue();

  // Find active barber matching URL parameter (or default to first barber)
  const activeBarber = useMemo(() => {
    if (!name) return barbers[0];
    const clean = name.toLowerCase().replace('barber-', '');
    const found = barbers.find(
      (b) => b.id.toLowerCase().includes(clean) || b.name.toLowerCase().includes(clean)
    );
    return found || barbers[0];
  }, [name, barbers]);

  // Current token assigned to this barber chair
  const currentToken = useMemo(() => {
    if (!activeBarber) return undefined;
    // Look for token with status IN_SERVICE or CALLED with this barber
    return queue.find(
      (t) =>
        t.assignedBarberId === activeBarber.id &&
        (t.status === 'IN_SERVICE' || t.status === 'CALLED')
    );
  }, [activeBarber, queue]);

  // Upcoming eligible queue for this barber (WAITING or UP_NEXT)
  const upcomingQueue = useMemo(() => {
    if (!activeBarber) return [];
    return queue
      .filter(
        (t) =>
          (t.status === 'WAITING' || t.status === 'UP_NEXT') &&
          (t.barberPreference === 'ANY' || t.barberPreference === activeBarber.id)
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [activeBarber, queue]);

  // Live Stopwatch State (elapsed seconds since serviceStartedAt)
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  // Cooldown countdown: seconds remaining in 2-min rest between customers
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (currentToken && currentToken.status === 'IN_SERVICE' && currentToken.serviceStartedAt) {
      const updateTimer = () => {
        const startMs = new Date(currentToken.serviceStartedAt!).getTime();
        const diffSecs = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
        setStopwatchSeconds(diffSecs);
      };
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    } else {
      setStopwatchSeconds(0);
    }
  }, [currentToken]);

  // Cooldown countdown ticker (runs every second when barber has cooldownUntil set)
  useEffect(() => {
    const updateCooldown = () => {
      if (activeBarber?.cooldownUntil) {
        const remaining = Math.max(0, Math.ceil((new Date(activeBarber.cooldownUntil).getTime() - Date.now()) / 1000));
        setCooldownSeconds(remaining);
      } else {
        setCooldownSeconds(0);
      }
    };
    updateCooldown();
    const interval = setInterval(updateCooldown, 1000);
    return () => clearInterval(interval);
  }, [activeBarber?.cooldownUntil]);

  // Chair Stopwatch Calculations & Auto-Completion countdown
  const totalPlannedMinutes = useMemo(() => {
    if (!currentToken) return 15;
    return currentToken.services.reduce((acc, s) => acc + s.durationMinutes, 0) || 15;
  }, [currentToken]);

  const totalPlannedSeconds = totalPlannedMinutes * 60;
  const remainingSeconds = Math.max(0, totalPlannedSeconds - stopwatchSeconds);
  const serviceProgressPercent = Math.min(100, Math.round((stopwatchSeconds / Math.max(1, totalPlannedSeconds)) * 100));

  // Format Stopwatch time: HH:MM:SS
  const formatStopwatch = (totalSeconds: number): string => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Notification Toast State
  const [bannerNotice, setBannerNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (bannerNotice) {
      const timer = setTimeout(() => setBannerNotice(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [bannerNotice]);

  // Actions
  const handleStartService = () => {
    if (!currentToken) return;
    const res = seatCustomer(currentToken.id, activeBarber.id);
    if (res.success) {
      setBannerNotice({
        type: 'success',
        message: `Service started for Token #${currentToken.id} (${currentToken.customerName}). Stopwatch running.`,
      });
    } else {
      setBannerNotice({ type: 'error', message: res.error || 'Failed to start service.' });
    }
  };

  const handleDoneService = () => {
    if (!currentToken) return;
    const res = completeService(currentToken.id, activeBarber.id);
    if (res.success) {
      setBannerNotice({
        type: 'success',
        message: `Service completed for Token #${currentToken.id}! Chair is now ready.`,
      });
    } else {
      setBannerNotice({ type: 'error', message: res.error || 'Failed to complete service.' });
    }
  };

  const handleCallNext = () => {
    const res = callNextForBarber(activeBarber.id);
    if (res.success && res.token) {
      setBannerNotice({
        type: 'success',
        message: `Called Token #${res.token.id} (${res.token.customerName}) to your chair!`,
      });
    } else {
      setBannerNotice({
        type: 'error',
        message: res.error || 'No customer available to call.',
      });
    }
  };

  const handleToggleBreak = () => {
    const res = toggleBarberBreak(activeBarber.id);
    if (res.success) {
      setBannerNotice({
        type: 'success',
        message: `Status updated for ${activeBarber.name}.`,
      });
    } else {
      setBannerNotice({ type: 'error', message: res.error || 'Failed to toggle break.' });
    }
  };

  const isServing = currentToken?.status === 'IN_SERVICE';
  const isCalling = currentToken?.status === 'CALLED';
  const isIdle = activeBarber.status === 'IDLE' && !currentToken;
  const isOnBreak = activeBarber.status === 'ON_BREAK';
  const isInCooldown = isIdle && cooldownSeconds > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* 1. Header with Station Switcher & Status Pill */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-charcoal-600">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-3xl">{activeBarber.avatar || '✂️'}</span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-100 flex items-center gap-2">
                <span>{language === 'gu' && activeBarber.nameGu ? activeBarber.nameGu : activeBarber.name}</span>
                <Badge variant="gold" size="sm">Chair {activeBarber.chairNumber}</Badge>
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {language === 'gu' && activeBarber.specialtiesGu
                  ? activeBarber.specialtiesGu
                  : activeBarber.specialtiesEn} • Shift: {activeBarber.shiftStart} - {activeBarber.shiftEnd}
              </p>
            </div>
          </div>
        </div>

        {/* Top Controls: Chair Switcher & Break Toggle */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Chair Selector */}
          <select
            value={activeBarber.id}
            onChange={(e) => {
              const selected = barbers.find((b) => b.id === e.target.value);
              if (selected) {
                navigate(`/barber/${selected.name.split(' ')[0]}`);
              }
            }}
            className="bg-onyx border border-charcoal-600 rounded-xl px-3 py-2 text-xs font-semibold text-gray-200 focus:outline-none focus:border-gold"
          >
            {barbers.map((b) => (
              <option key={b.id} value={b.id}>
                Chair {b.chairNumber}: {b.name} ({b.status})
              </option>
            ))}
          </select>

          {/* Auto-Accept Toggle */}
          <button
            type="button"
            onClick={toggleAutoAccept}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
              isAutoAcceptActive
                ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300 shadow-sm'
                : 'bg-charcoal-700 border-charcoal-600 text-gray-400 hover:text-gray-200'
            }`}
            title="When active, idle chairs automatically accept the next customer in line"
          >
            <Sparkles size={13} className={isAutoAcceptActive ? 'text-emerald-400' : 'text-gray-400'} />
            <span>Auto-Accept: {isAutoAcceptActive ? 'ON' : 'OFF'}</span>
          </button>

          {/* Available / On Break Toggle */}
          <Button
            size="sm"
            variant={isOnBreak ? 'secondary' : 'slate'}
            disabled={isServing || isCalling}
            onClick={handleToggleBreak}
            className="gap-1.5 py-2 text-xs"
            title={isServing || isCalling ? t('barber_break_blocked') : ''}
          >
            <Coffee size={14} className={isOnBreak ? 'text-amber-400' : 'text-gray-400'} />
            <span>{isOnBreak ? t('barber_on_break') : t('barber_ready')}</span>
          </Button>
        </div>
      </div>

      {/* Banner Notice */}
      {bannerNotice && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
            bannerNotice.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-600/50 text-emerald-300'
              : 'bg-red-950/80 border-red-600/50 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {bannerNotice.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-400" />
            ) : (
              <AlertCircle size={16} className="text-red-400" />
            )}
            <span>{bannerNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerNotice(null)}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Main Active Client in Chair Deck */}
      <Card goldAccent title={t('barber_current_client')}>
        {currentToken ? (
          <div className="space-y-6">
            {/* Customer Header Strip */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-charcoal-700/80 border border-charcoal-600">
              <div>
                <span className="text-[11px] text-gray-400 uppercase font-semibold">Active Patron</span>
                <p className="text-2xl font-black text-gray-100 mt-0.5">
                  {currentToken.customerName}
                </p>
                <p className="text-xs text-gray-400 font-mono flex items-center gap-1.5 mt-1">
                  <Phone size={12} className="text-gold" />
                  +91 {currentToken.customerPhone}
                </p>
              </div>

              <div className="text-right sm:text-right">
                <span className="text-[11px] text-gray-400 uppercase font-semibold block">Token Number</span>
                <span className="text-4xl font-black text-gold font-mono tracking-wider">
                  #{currentToken.id}
                </span>
                <div className="mt-1">
                  {isServing && <Badge variant="in_service" size="sm" pulse>Now In Service</Badge>}
                  {isCalling && <Badge variant="up_next" size="sm" pulse>Called (Arriving)</Badge>}
                </div>
              </div>
            </div>

            {/* Selected Services Checklist */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-300">
                  Booked Services ({currentToken.services.length} / 3 Max):
                </p>
                <span className="text-xs text-emerald-400 font-bold font-mono">
                  Total: ₹{currentToken.services.reduce((acc, s) => acc + s.priceInr, 0)}
                </span>
              </div>

              <div className="space-y-2">
                {currentToken.services.map((service) => (
                  <div
                    key={service.id}
                    className="p-3 rounded-xl bg-charcoal-700/60 border border-charcoal-600 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 size={16} className="text-gold flex-shrink-0" />
                      <div>
                        <p className="font-bold text-gray-100">
                          {language === 'gu' ? service.nameGu : service.nameEn}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {language === 'gu' && service.descriptionGu ? service.descriptionGu : service.descriptionEn}
                        </p>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-gray-300 block">{service.durationMinutes} mins</span>
                      <span className="text-gold font-bold">₹{service.priceInr}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chair Stopwatch & Auto-Finish Countdown Timer */}
            <div className="p-4 rounded-2xl bg-charcoal-800 border-2 border-charcoal-600 text-center space-y-2.5 shadow-inner">
              <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                <span className="uppercase tracking-widest font-semibold flex items-center gap-1.5">
                  <Clock size={14} className="text-gold" />
                  <span>{t('barber_chair_stopwatch')}</span>
                </span>
                {isServing && (
                  <span className="text-gold font-mono font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-gold animate-ping"></span>
                    <span>Auto-finish in {Math.floor(remainingSeconds / 60)}m {remainingSeconds % 60}s</span>
                  </span>
                )}
              </div>

              <p className="text-4xl sm:text-5xl font-mono font-bold text-emerald-400 tracking-wider">
                {formatStopwatch(stopwatchSeconds)}
              </p>

              {/* Progress bar showing service elapsed vs total duration */}
              {isServing && (
                <div className="w-full bg-charcoal-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 via-gold to-emerald-400 h-full transition-all duration-1000"
                    style={{ width: `${serviceProgressPercent}%` }}
                  />
                </div>
              )}

              <p className="text-[11px] text-gray-400 flex items-center justify-center gap-2">
                <span>{t('barber_est_total')}: {totalPlannedMinutes} mins</span>
                <span>•</span>
                <span className="text-gray-300">Auto-completes after service time (no button press required)</span>
              </p>
            </div>

            {/* Primary Action Buttons: Start & Done */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Start Button (Active if CALLED) */}
              <Button
                size="lg"
                variant="primary"
                disabled={isServing}
                onClick={handleStartService}
                className="gap-2 text-sm sm:text-base py-3.5"
              >
                <Play size={18} />
                <span>{t('barber_start_btn')}</span>
              </Button>

              {/* Done Button (Active if IN_SERVICE) */}
              <Button
                size="lg"
                variant={isServing ? 'primary' : 'slate'}
                disabled={!isServing}
                onClick={handleDoneService}
                className="gap-2 text-sm sm:text-base py-3.5"
              >
                <Check size={18} />
                <span>{t('barber_done_btn')}</span>
              </Button>
            </div>

            {/* No-Show Action if client failed to report */}
            {isCalling && (
              <div className="pt-1 text-center">
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => markNoShow(currentToken.id)}
                  className="gap-1.5 text-xs"
                >
                  <AlertTriangle size={14} />
                  <span>Mark Client as No-Show</span>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-charcoal-700 border border-charcoal-600 flex items-center justify-center text-gold">
              <Scissors size={28} />
            </div>
            <div className="space-y-1">
              <p className="text-base font-bold text-gray-200">
                {isOnBreak ? t('barber_on_break') : t('barber_no_current_client')}
              </p>
              <p className="text-xs text-gray-400">
                {upcomingQueue.length > 0
                  ? `${upcomingQueue.length} customer(s) are eligible and waiting in queue.`
                  : t('barber_upcoming_empty')}
              </p>
            </div>

            {/* 2-Minute Cooldown Banner */}
            {isInCooldown && (
              <div className="mx-auto max-w-xs p-4 rounded-2xl bg-amber-950/60 border border-amber-600/40 text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-amber-300">
                  <Coffee size={16} className="text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">Barber Resting</span>
                </div>
                <p className="text-3xl font-mono font-black text-amber-300">
                  {String(Math.floor(cooldownSeconds / 60)).padStart(2, '0')}:{String(cooldownSeconds % 60).padStart(2, '0')}
                </p>
                <p className="text-[11px] text-amber-400/80">
                  Next patron will be auto-accepted after rest period
                </p>
                {/* Cooldown progress bar */}
                <div className="w-full bg-charcoal-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full transition-all duration-1000"
                    style={{ width: `${Math.round((cooldownSeconds / 120) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Call Next Customer Button */}
            {isIdle && !isInCooldown && upcomingQueue.length > 0 && (
              <Button
                size="lg"
                variant="primary"
                onClick={handleCallNext}
                className="gap-2 text-sm sm:text-base py-3.5 px-6 shadow-gold-glow"
              >
                <UserCheck size={18} />
                <span>{t('barber_call_next_btn')}</span>
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* 3. Upcoming Next in Queue Preview */}
      <Card title={t('barber_upcoming')} subtitle="Eligible waiting patrons prioritized chronologically (FCFS)">
        {upcomingQueue.length === 0 ? (
          <p className="text-xs text-gray-400 italic py-4 text-center">
            {t('barber_upcoming_empty')}
          </p>
        ) : (
          <div className="space-y-2.5">
            {upcomingQueue.map((item, idx) => {
              const isSpecific = item.barberPreference === activeBarber.id;
              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-charcoal-700/60 border border-charcoal-600 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-gold text-base">
                      #{item.id}
                    </span>
                    <div>
                      <p className="font-bold text-gray-100 flex items-center gap-2">
                        <span>{item.customerName}</span>
                        {isSpecific ? (
                          <span className="text-[10px] text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-600/40">
                            Requested You
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400 bg-charcoal-700 px-2 py-0.5 rounded">
                            Any Barber
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {item.services.map((s) => (language === 'gu' ? s.nameGu : s.nameEn)).join(' + ')}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <Badge variant={idx === 0 ? 'up_next' : 'waiting'} size="sm">
                      {idx === 0 ? 'Next in Line' : `${idx + 1} in queue`}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
