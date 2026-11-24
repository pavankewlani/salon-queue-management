import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useQueue } from '../context/QueueContext';
import { ServiceItem, BarberPreference, QueueToken } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Users,
  PlusCircle,
  AlertTriangle,
  Phone,
  Scissors,
  Coffee,
  CheckCircle2,
  Tablet,
  UserCheck,
  AlertCircle,
  RotateCcw
} from 'lucide-react';

export const ReceptionScreen: React.FC = () => {
  const { t, language } = useLanguage();
  const {
    services,
    barbers,
    queue,
    callNextForBarber,
    seatCustomer,
    completeService,
    markNoShow,
    cancelToken,
    toggleBarberBreak,
    addWalkIn,
  } = useQueue();

  // Tablet Landscape Filter Tabs: 'all' | 'waiting' | 'in_service' | 'terminal'
  const [activeFilter, setActiveFilter] = useState<'all' | 'waiting' | 'in_service' | 'terminal'>('all');

  // Walk-in form state
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInServices, setWalkInServices] = useState<ServiceItem[]>([services[0]]);
  const [walkInBarber, setWalkInBarber] = useState<BarberPreference>('ANY');
  const [walkInError, setWalkInError] = useState('');
  const [walkInSuccess, setWalkInSuccess] = useState('');

  // Cancellation Confirmation Modal State
  const [cancelModalToken, setCancelModalToken] = useState<QueueToken | null>(null);

  // Action notification banners
  const [actionNotice, setActionNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Auto-clear notification after 4 seconds
  useEffect(() => {
    if (actionNotice) {
      const timer = setTimeout(() => setActionNotice(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionNotice]);

  // Live timer tick for calculating waiting duration (refreshes every 5 seconds for <5s sync)
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((prev) => prev + 1), 5000);
    return () => clearInterval(interval);
  }, []);

  // Format waiting duration since createdAt
  const getElapsedMinutes = (isoDate: string): string => {
    const elapsedMs = Date.now() - new Date(isoDate).getTime();
    const mins = Math.max(0, Math.floor(elapsedMs / (60 * 1000)));
    return `${mins}m`;
  };

  // Walk-in service toggle
  const handleToggleWalkInService = (service: ServiceItem) => {
    if (walkInServices.some((s) => s.id === service.id)) {
      setWalkInServices((prev) => prev.filter((s) => s.id !== service.id));
    } else {
      if (walkInServices.length >= 3) {
        setWalkInError(t('err_max_services'));
        return;
      }
      setWalkInServices((prev) => [...prev, service]);
      setWalkInError('');
    }
  };

  // Walk-in form submit
  const handleAddWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setWalkInError('');
    setWalkInSuccess('');

    if (!walkInName.trim()) {
      setWalkInError(t('err_name_required'));
      return;
    }

    const cleanPhone = walkInPhone.trim().replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setWalkInError(t('err_phone_invalid'));
      return;
    }

    if (walkInServices.length === 0) {
      setWalkInError(t('err_service_required'));
      return;
    }

    const res = await addWalkIn({
      customerName: walkInName.trim(),
      customerPhone: cleanPhone,
      services: walkInServices,
      barberPreference: walkInBarber,
    });

    if (res.success && res.token) {
      setWalkInSuccess(t('reception_walkin_success', { id: res.token.id }));
      setWalkInName('');
      setWalkInPhone('');
      setWalkInServices([services[0]]);
      setWalkInBarber('ANY');
    } else {
      setWalkInError(res.error || 'Failed to add walk-in customer.');
    }
  };

  // Call Next Handler
  const handleCallNext = (barberId: string) => {
    const result = callNextForBarber(barberId);
    if (result.success && result.token) {
      setActionNotice({
        type: 'success',
        message: `Called Token #${result.token.id} (${result.token.customerName}) for chair! 10-minute timer started.`,
      });
    } else {
      setActionNotice({
        type: 'error',
        message: result.error || 'Could not call customer.',
      });
    }
  };

  // Filtered queue tokens
  const filteredQueue = queue.filter((token) => {
    if (activeFilter === 'waiting') return token.status === 'WAITING' || token.status === 'UP_NEXT';
    if (activeFilter === 'in_service') return token.status === 'IN_SERVICE' || token.status === 'CALLED';
    if (activeFilter === 'terminal') return ['COMPLETED', 'NO_SHOW', 'CANCELLED'].includes(token.status);
    return true; // 'all'
  });

  return (
    <div className="space-y-5 animate-fadeIn pb-12">
      {/* 1. Tablet Landscape Top Control Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-charcoal-600">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-100 tracking-tight">
              {t('reception_title')}
            </h1>
            <Badge variant="gold" size="sm">
              <Tablet size={12} className="text-gold" />
              <span>{t('reception_landscape_hint')}</span>
            </Badge>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            First-Come, First-Served queue orchestrator • Real-time synchronization active (&lt; 5s)
          </p>
        </div>

        {/* Quick Operational Metrics */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 rounded-xl bg-onyx border border-charcoal-600 flex items-center gap-2 text-xs">
            <Users size={14} className="text-gold" />
            <span className="text-gray-400">Waiting:</span>
            <span className="font-bold text-gray-100 font-mono">
              {queue.filter((t) => t.status === 'WAITING' || t.status === 'UP_NEXT').length}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-onyx border border-charcoal-600 flex items-center gap-2 text-xs">
            <Scissors size={14} className="text-emerald-400" />
            <span className="text-gray-400">In Chair:</span>
            <span className="font-bold text-emerald-400 font-mono">
              {queue.filter((t) => t.status === 'IN_SERVICE').length}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-onyx border border-charcoal-600 flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold text-emerald-400 text-[11px]">Synced &lt; 5s</span>
          </div>
        </div>
      </div>

      {/* Global Notification Banner */}
      {actionNotice && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
            actionNotice.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-600/50 text-emerald-300'
              : 'bg-red-950/80 border-red-600/50 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionNotice.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
            )}
            <span>{actionNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Barber Chair Stations Matrix (Horizontal Tablet Landscape Carousel/Grid) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
            <Scissors size={16} className="text-gold" />
            <span>{t('reception_chairs_title')}</span>
          </h2>
          <span className="text-[11px] text-gray-400">
            {barbers.filter((b) => b.status === 'IDLE').length} Chairs Available
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {barbers.map((barber) => {
            const isIdle = barber.status === 'IDLE';
            const isCalling = barber.status === 'CALLING';
            const isServing = barber.status === 'IN_SERVICE';
            const isOnBreak = barber.status === 'ON_BREAK';

            return (
              <div
                key={barber.id}
                className={`p-4 rounded-2xl bg-onyx border transition-all duration-200 flex flex-col justify-between ${
                  isIdle
                    ? 'border-emerald-600/50 shadow-sm'
                    : isCalling
                    ? 'border-amber-500 shadow-gold-glow animate-pulse'
                    : isServing
                    ? 'border-gold/50 shadow-gold-glow'
                    : 'border-charcoal-600 opacity-80'
                }`}
              >
                {/* Station Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{barber.avatar || '✂️'}</span>
                    <div>
                      <p className="font-bold text-sm text-gray-100 flex items-center gap-1.5">
                        <span>{language === 'gu' && barber.nameGu ? barber.nameGu : barber.name}</span>
                      </p>
                      <p className="text-[11px] text-gold font-semibold">
                        Chair {barber.chairNumber}
                      </p>
                    </div>
                  </div>

                  <div>
                    {isIdle && <Badge variant="in_service" size="sm">Available</Badge>}
                    {isCalling && <Badge variant="up_next" size="sm" pulse>Calling</Badge>}
                    {isServing && <Badge variant="gold" size="sm">Busy</Badge>}
                    {isOnBreak && <Badge variant="no_show" size="sm">Break</Badge>}
                  </div>
                </div>

                {/* Current Customer Card inside Chair Station */}
                <div className="my-3 p-3 rounded-xl bg-charcoal-700/80 border border-charcoal-600 text-xs space-y-1">
                  <p className="text-[10px] text-gray-400 uppercase font-semibold">Active Chair Occupancy</p>
                  {barber.currentCustomerTokenId ? (
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-gold text-sm">
                          #{barber.currentCustomerTokenId}
                        </span>
                        <span className="text-[11px] text-emerald-400 font-semibold">
                          {isCalling ? '10m Grace Window' : 'In Service'}
                        </span>
                      </div>
                      <p className="text-gray-200 font-medium truncate">
                        {barber.currentCustomerName || 'Patron'}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-400 italic py-1">
                      {isOnBreak ? 'Barber on 15m break' : 'Chair ready for client'}
                    </p>
                  )}
                </div>

                {/* Chair Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-charcoal-700">
                  {/* Call Next Button (Strict FCFS with preference check) */}
                  <Button
                    size="sm"
                    variant={isIdle ? 'primary' : 'slate'}
                    disabled={!isIdle}
                    fullWidth
                    onClick={() => handleCallNext(barber.id)}
                    className="gap-1 py-2 text-xs"
                    title={!isIdle ? 'Barber is not available' : 'Call earliest eligible customer'}
                  >
                    <UserCheck size={13} />
                    <span>{t('reception_call_next')}</span>
                  </Button>

                  {/* Toggle Break */}
                  <button
                    type="button"
                    onClick={() => toggleBarberBreak(barber.id)}
                    disabled={isServing || isCalling}
                    className="p-2 rounded-xl bg-charcoal-700 hover:bg-charcoal-600 text-gray-300 hover:text-white border border-charcoal-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title={isOnBreak ? 'Resume shift' : 'Take 15m break'}
                  >
                    <Coffee size={14} className={isOnBreak ? 'text-amber-400' : 'text-gray-400'} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Main Landscape Split: Queue Timeline (Left 2 spans) & Quick Walk-In Form (Right 1 span) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Left Pane: Real-Time Queue Timeline (2 Spans) */}
        <div className="lg:col-span-2 space-y-3.5">
          <Card
            title={t('reception_queue_title')}
            subtitle="Prioritized strictly by arrival timestamp (FCFS) with stylist preference arbitration"
            headerAction={
              <div className="flex items-center gap-1 bg-charcoal-700 p-1 rounded-xl border border-charcoal-600">
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    activeFilter === 'all' ? 'bg-gold text-onyx shadow-sm' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {t('reception_all_filter')} ({queue.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('waiting')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    activeFilter === 'waiting' ? 'bg-gold text-onyx shadow-sm' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {t('reception_waiting_filter')} ({queue.filter((t) => t.status === 'WAITING' || t.status === 'UP_NEXT').length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('in_service')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    activeFilter === 'in_service' ? 'bg-gold text-onyx shadow-sm' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {t('reception_serving_filter')} ({queue.filter((t) => t.status === 'IN_SERVICE' || t.status === 'CALLED').length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('terminal')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    activeFilter === 'terminal' ? 'bg-gold text-onyx shadow-sm' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {t('reception_completed_filter')} ({queue.filter((t) => ['COMPLETED', 'NO_SHOW', 'CANCELLED'].includes(t.status)).length})
                </button>
              </div>
            }
          >
            {/* Tablet Landscape Queue Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300 divide-y divide-charcoal-600">
                <thead className="bg-charcoal-700/80 uppercase tracking-wider text-gray-400 font-semibold text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Token</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Services (Max 3)</th>
                    <th className="py-2.5 px-3">Barber Pref</th>
                    <th className="py-2.5 px-3">Elapsed</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Chair Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-600">
                  {filteredQueue.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-400 italic">
                        No queue entries match this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredQueue.map((token) => {
                      const isWaiting = token.status === 'WAITING';
                      const isUpNext = token.status === 'UP_NEXT';
                      const isCalled = token.status === 'CALLED';
                      const isInService = token.status === 'IN_SERVICE';
                      const isTerminal = ['COMPLETED', 'NO_SHOW', 'CANCELLED'].includes(token.status);

                      const preferredBarber = barbers.find((b) => b.id === token.barberPreference);

                      return (
                        <tr
                          key={token.id}
                          className={`hover:bg-charcoal-700/50 transition-colors ${
                            isCalled
                              ? 'bg-amber-950/20'
                              : isInService
                              ? 'bg-emerald-950/10'
                              : ''
                          }`}
                        >
                          {/* Token ID */}
                          <td className="py-3 px-3">
                            <span className="font-mono font-bold text-gold text-sm">
                              #{token.id}
                            </span>
                            {token.isWalkIn && (
                              <span className="block text-[10px] text-gray-400 font-sans">
                                Walk-in
                              </span>
                            )}
                          </td>

                          {/* Customer Name & Phone */}
                          <td className="py-3 px-3">
                            <p className="font-bold text-gray-100">{token.customerName}</p>
                            <p className="text-[11px] text-gray-400 font-mono">
                              +91 {token.customerPhone}
                            </p>
                          </td>

                          {/* Services */}
                          <td className="py-3 px-3">
                            <div className="space-y-0.5">
                              {token.services.map((s) => (
                                <span
                                  key={s.id}
                                  className="inline-block px-1.5 py-0.5 rounded bg-charcoal-700 text-[10px] text-gray-300 mr-1"
                                >
                                  {language === 'gu' ? s.nameGu : s.nameEn} ({s.durationMinutes}m)
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* Preferred Barber */}
                          <td className="py-3 px-3">
                            {preferredBarber ? (
                              <span className="font-medium text-gold">
                                {preferredBarber.name} (Chair {preferredBarber.chairNumber})
                              </span>
                            ) : (
                              <span className="text-gray-400 italic">
                                Any Available
                              </span>
                            )}
                          </td>

                          {/* Waiting Duration */}
                          <td className="py-3 px-3 font-mono text-gray-300">
                            {getElapsedMinutes(token.createdAt)}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3 px-3">
                            {isWaiting && <Badge variant="waiting" size="sm">Waiting</Badge>}
                            {isUpNext && <Badge variant="up_next" size="sm" pulse>Up Next</Badge>}
                            {isCalled && <Badge variant="up_next" size="sm" pulse>Called (10m)</Badge>}
                            {isInService && <Badge variant="in_service" size="sm">In Chair</Badge>}
                            {token.status === 'COMPLETED' && <Badge variant="completed" size="sm">Finished</Badge>}
                            {token.status === 'NO_SHOW' && <Badge variant="no_show" size="sm">No-Show</Badge>}
                            {token.status === 'CANCELLED' && <Badge variant="cancelled" size="sm">Cancelled</Badge>}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* If CALLED -> Seat or No-Show */}
                              {isCalled && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() => seatCustomer(token.id)}
                                    className="px-2.5 py-1 text-xs"
                                  >
                                    {t('reception_seat_client')}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="danger"
                                    onClick={() => markNoShow(token.id)}
                                    className="px-2.5 py-1 text-xs"
                                  >
                                    {t('btn_mark_no_show')}
                                  </Button>
                                </>
                              )}

                              {/* If IN_SERVICE -> Finish */}
                              {isInService && (
                                <Button
                                  size="sm"
                                  variant="slate"
                                  onClick={() => completeService(token.id, token.assignedBarberId || 'barber-amit')}
                                  className="px-2.5 py-1 text-xs"
                                >
                                  {t('reception_finish_service')}
                                </Button>
                              )}

                              {/* If WAITING or UP_NEXT -> Cancel or Call */}
                              {(isWaiting || isUpNext) && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setCancelModalToken(token)}
                                  className="px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40"
                                >
                                  {t('btn_cancel_token')}
                                </Button>
                              )}

                              {/* If NO_SHOW -> Re-Add to end of queue with new token (Scenario 11) */}
                              {token.status === 'NO_SHOW' && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={async () => {
                                    const res = await addWalkIn({
                                      customerName: token.customerName,
                                      customerPhone: token.customerPhone,
                                      services: token.services,
                                      barberPreference: token.barberPreference,
                                    });
                                    if (res.success && res.token) {
                                      setActionNotice({
                                        message: `Re-added ${token.customerName} at tail of queue with new token #${res.token.id}.`,
                                        type: 'success',
                                      });
                                    }
                                  }}
                                  className="px-2 py-1 text-xs gap-1 text-gold border-gold/40 hover:bg-gold/10"
                                >
                                  <RotateCcw size={11} />
                                  <span>Re-Add</span>
                                </Button>
                              )}

                              {/* Terminal status marker for COMPLETED or CANCELLED */}
                              {isTerminal && token.status !== 'NO_SHOW' && (
                                <span className="text-[11px] text-gray-500 font-mono">—</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Pane: Quick Walk-In Registration Form (1 Span) */}
        <div className="space-y-4">
          <Card
            title={t('reception_walkin_title')}
            subtitle="Walk-in exception allowed past 30-min online cutoff"
          >
            {walkInSuccess && (
              <div className="p-3 mb-3 rounded-xl bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                <span>{walkInSuccess}</span>
              </div>
            )}

            {walkInError && (
              <div className="p-3 mb-3 rounded-xl bg-red-950/80 border border-red-600/50 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                <span>{walkInError}</span>
              </div>
            )}

            <form onSubmit={handleAddWalkIn} className="space-y-3.5 text-xs">
              {/* Name */}
              <div>
                <label className="block font-bold text-gray-300 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  placeholder="e.g. Ramesh Shah"
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-xl px-3 py-2 text-gray-100 text-xs focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block font-bold text-gray-300 mb-1">
                  10-Digit Mobile Phone *
                </label>
                <div className="relative">
                  <Phone size={13} className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="tel"
                    value={walkInPhone}
                    onChange={(e) => setWalkInPhone(e.target.value)}
                    placeholder="e.g. 9825012345"
                    maxLength={10}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-xl pl-8 pr-3 py-2 text-gray-100 text-xs font-mono focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                  />
                </div>
              </div>

              {/* Services Multi-select (Max 3) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-gray-300">
                    Select Services (Max 3) *
                  </label>
                  <span className="text-[10px] text-gold font-semibold">
                    {walkInServices.length} / 3 Selected
                  </span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {services.map((service) => {
                    const isSelected = walkInServices.some((s) => s.id === service.id);
                    return (
                      <div
                        key={service.id}
                        onClick={() => handleToggleWalkInService(service)}
                        className={`p-2 rounded-lg border text-[11px] flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-charcoal-700 border-gold text-gray-100'
                            : 'bg-charcoal-700/40 border-charcoal-600 text-gray-400 hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="accent-gold rounded"
                          />
                          <span>{language === 'gu' ? service.nameGu : service.nameEn}</span>
                        </div>
                        <span className="font-bold text-gold">₹{service.priceInr}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Barber Preference */}
              <div>
                <label className="block font-bold text-gray-300 mb-1">
                  Barber Assignment Preference
                </label>
                <select
                  value={walkInBarber}
                  onChange={(e) => setWalkInBarber(e.target.value)}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-xl px-3 py-2 text-gray-100 text-xs focus:outline-none focus:border-gold"
                >
                  <option value="ANY">{t('pref_any_barber')}</option>
                  {barbers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} (Chair {b.chairNumber} • {b.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit Walk-In Button */}
              <Button size="md" fullWidth type="submit" className="gap-2 mt-2 py-3 text-xs">
                <PlusCircle size={15} />
                <span>{t('reception_walkin_btn')}</span>
              </Button>
            </form>
          </Card>
        </div>
      </div>

      {/* 4. Cancel Confirmation Dialog Modal */}
      {cancelModalToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-onyx rounded-2xl border-2 border-red-500/60 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle size={24} />
              <h3 className="font-bold text-lg text-gray-100">
                {t('cancel_confirm_title')}
              </h3>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              {t('cancel_confirm_desc', { id: cancelModalToken.id })}
            </p>

            <div className="p-3 rounded-xl bg-charcoal-700/80 border border-charcoal-600 text-xs space-y-1">
              <p className="font-bold text-gray-200">
                Patron: {cancelModalToken.customerName}
              </p>
              <p className="text-gray-400">
                Phone: +91 {cancelModalToken.customerPhone} • Services: {cancelModalToken.services.length} booked
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="ghost"
                size="md"
                onClick={() => setCancelModalToken(null)}
              >
                {t('cancel_dismiss_btn')}
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={() => {
                  cancelToken(cancelModalToken.id);
                  setCancelModalToken(null);
                  setActionNotice({
                    type: 'success',
                    message: `Token #${cancelModalToken.id} was successfully cancelled.`,
                  });
                }}
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
