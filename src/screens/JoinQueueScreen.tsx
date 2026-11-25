import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useQueue } from '../context/QueueContext';
import { useAuth } from '../context/AuthContext';
import { ServiceItem, BarberPreference } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  ArrowLeft,
  CheckCircle2,
  User,
  Phone,
  Scissors,
  Clock,
  IndianRupee,
  AlertCircle,
  ShieldAlert,
  Sparkles,
  Info
} from 'lucide-react';

export const JoinQueueScreen: React.FC = () => {
  const { t, language } = useLanguage();
  const {
    services,
    barbers,
    salonConfig,
    isOnlineQueueOpen,
    toggleSimulatedQueueHours,
    isPhoneActiveInQueue,
    addTokenToQueue,
    getBarberWaitMins
  } = useQueue();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Active services available for customer selection (disabled services disappear automatically)
  const activeServices = useMemo(() => {
    return services.filter((s) => s.isActive !== false);
  }, [services]);

  // Form State
  const [customerName, setCustomerName] = useState(() => (user?.name ? user.name : ''));
  const [customerPhone, setCustomerPhone] = useState(() => (user?.phone ? user.phone : ''));

  // If user signs in or changes while on this screen
  useEffect(() => {
    if (user?.name && !customerName) {
      setCustomerName(user.name);
    }
    if (user?.phone && !customerPhone) {
      setCustomerPhone(user.phone);
    }
  }, [user]);
  const [selectedServices, setSelectedServices] = useState<ServiceItem[]>(() => {
    const active = services.filter((s) => s.isActive !== false);
    return active.length > 0 ? [active[0]] : [];
  });
  const [barberPreference, setBarberPreference] = useState<BarberPreference>('ANY');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync selectedServices if a service is disabled in Owner Settings
  useEffect(() => {
    setSelectedServices((prev) => {
      const filtered = prev.filter((s) => activeServices.some((as) => as.id === s.id));
      if (filtered.length === 0 && activeServices.length > 0) {
        return [activeServices[0]];
      }
      return filtered;
    });
  }, [activeServices]);

  // Field Validation Errors
  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    services?: string;
    general?: string;
  }>({});

  // Dynamic calculations
  const totalDuration = useMemo(() => {
    return selectedServices.reduce((acc, s) => acc + s.durationMinutes, 0);
  }, [selectedServices]);

  const totalPrice = useMemo(() => {
    return selectedServices.reduce((acc, s) => acc + s.priceInr, 0);
  }, [selectedServices]);

  const estimatedWaitMins = useMemo(() => {
    return getBarberWaitMins(barberPreference);
  }, [barberPreference, getBarberWaitMins]);

  // Estimated seat time string
  const estimatedSeatTime = useMemo(() => {
    const seatDate = new Date(Date.now() + estimatedWaitMins * 60 * 1000);
    return seatDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [estimatedWaitMins]);

  // Dynamic cutoff display time string
  const cutoffTimeDisplay = useMemo(() => {
    const [closeHour, closeMin] = (salonConfig?.closingTime || '21:00').split(':').map(Number);
    const cutoffMinutes = salonConfig?.onlineCutoffMinutesBeforeClosing ?? 30;
    const totalCloseMins = closeHour * 60 + closeMin;
    const cutoffTotalMins = totalCloseMins - cutoffMinutes;
    const cutoffH = Math.floor(cutoffTotalMins / 60);
    const cutoffM = cutoffTotalMins % 60;
    const period = cutoffH >= 12 ? 'PM' : 'AM';
    const displayH = cutoffH % 12 || 12;
    return `${String(displayH).padStart(2, '0')}:${String(cutoffM).padStart(2, '0')} ${period}`;
  }, [salonConfig]);

  // Service toggle with strict 3-service maximum enforcement
  const handleToggleService = (service: ServiceItem) => {
    const isSelected = selectedServices.some((s) => s.id === service.id);

    if (isSelected) {
      // Allow deselecting, but keep at least 0 (validation catches 0 on submit)
      setSelectedServices((prev) => prev.filter((s) => s.id !== service.id));
      if (errors.services) {
        setErrors((prev) => ({ ...prev, services: undefined }));
      }
    } else {
      // Invariant 03: Maximum 3 services
      if (selectedServices.length >= 3) {
        setErrors((prev) => ({ ...prev, services: t('err_max_services') }));
        return;
      }
      setSelectedServices((prev) => [...prev, service]);
      setErrors((prev) => ({ ...prev, services: undefined }));
    }
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};

    // 1. Name validation
    if (!customerName.trim() || customerName.trim().length < 2) {
      newErrors.name = t('err_name_required');
    }

    // 2. Phone validation (10-digit Indian standard: starts with 6-9)
    const cleanPhone = customerPhone.trim().replace(/\D/g, '');
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      newErrors.phone = t('err_phone_invalid');
    } else {
      // Invariant 04: Duplicate phone active token check
      const duplicateCheck = isPhoneActiveInQueue(cleanPhone);
      if (duplicateCheck.isActive && duplicateCheck.activeToken) {
        newErrors.phone = t('err_duplicate_phone', { tokenId: `#${duplicateCheck.activeToken.id}` });
      }
    }

    // 3. Service selection validation (1 to 3 services)
    if (selectedServices.length === 0) {
      newErrors.services = t('err_service_required');
    } else if (selectedServices.length > 3) {
      newErrors.services = t('err_max_services');
    }

    // 4. Online cutoff check
    if (!isOnlineQueueOpen) {
      newErrors.general = t('err_online_closed');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const result = await addTokenToQueue({
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        services: selectedServices,
        barberPreference,
      });

      if (result.success && result.token) {
        // Immediate redirection to Screen 3: My Status
        navigate(`/status/${result.token.id}`);
      } else {
        setErrors({ general: result.error || 'Failed to join queue.' });
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Back button */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-gold transition-colors py-1"
      >
        <ArrowLeft size={16} />
        <span>{language === 'gu' ? 'પાછા હોમ પર જાઓ' : 'Back to Home'}</span>
      </Link>

      {/* Screen Title */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Badge variant="gold" size="sm">
            <Sparkles size={12} className="text-gold" />
            <span>Step 2 / 2</span>
          </Badge>
          <span className="text-xs text-gray-400 font-medium">
            {t('invariant_phone_rule')}
          </span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-100">
          {t('join_title')}
        </h1>
        <p className="text-xs sm:text-sm text-gray-400">
          {t('join_subtitle')}
        </p>
      </div>

      {/* Online Queue Cutoff Banner */}
      {!isOnlineQueueOpen ? (
        <div className="p-4 rounded-2xl bg-red-950/80 border border-red-600/50 text-red-200 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <p className="font-bold flex items-center gap-1.5 text-sm text-red-300">
              <AlertCircle size={16} />
              {t('cutoff_notice_title')}
            </p>
            <button
              type="button"
              onClick={toggleSimulatedQueueHours}
              className="text-[11px] underline text-gold hover:text-white"
            >
              Simulate Open Hours
            </button>
          </div>
          <p>{t('cutoff_notice_desc')}</p>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-onyx border border-charcoal-600 flex items-center justify-between text-xs text-gray-300">
          <span className="flex items-center gap-2">
            <Clock size={15} className="text-gold" />
            <span>Online Queue open until {cutoffTimeDisplay} ({salonConfig.onlineCutoffMinutesBeforeClosing ?? 30}m Cutoff)</span>
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="in_service" size="sm" pulse>Open</Badge>
            <button
              type="button"
              onClick={toggleSimulatedQueueHours}
              title="Click to test cutoff behavior"
              className="text-[10px] text-gray-400 hover:text-gold"
            >
              (Test Cutoff)
            </button>
          </div>
        </div>
      )}

      {/* General Submission Error Banner */}
      {errors.general && (
        <div className="p-4 rounded-xl bg-red-900/40 border border-red-500/60 text-red-200 text-xs flex items-start gap-2.5">
          <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
          <span>{errors.general}</span>
        </div>
      )}

      {/* Main Registration Card */}
      <Card goldAccent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Customer Name */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
              1. {t('label_full_name')} <span className="text-gold">*</span>
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
              <input
                type="text"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                placeholder={t('label_full_name_placeholder')}
                className={`w-full bg-charcoal-700 border ${
                  errors.name ? 'border-red-500' : 'border-charcoal-600'
                } rounded-xl pl-10 pr-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors`}
              />
            </div>
            {errors.name && (
              <p className="text-xs text-red-400 flex items-center gap-1.5 mt-1">
                <AlertCircle size={13} />
                <span>{errors.name}</span>
              </p>
            )}
          </div>

          {/* Step 2: Customer Phone Number */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
                2. {t('label_phone')} <span className="text-gold">*</span>
              </label>
              <span className="text-[11px] text-gray-400">
                {t('phone_hint')}
              </span>
            </div>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => {
                  setCustomerPhone(e.target.value);
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                }}
                placeholder={t('label_phone_placeholder')}
                maxLength={10}
                className={`w-full bg-charcoal-700 border ${
                  errors.phone ? 'border-red-500' : 'border-charcoal-600'
                } rounded-xl pl-10 pr-4 py-3 text-sm text-gray-100 placeholder-gray-500 font-mono focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors`}
              />
            </div>
            {errors.phone && (
              <p className="text-xs text-red-400 flex items-center gap-1.5 mt-1">
                <AlertCircle size={13} />
                <span>{errors.phone}</span>
              </p>
            )}
          </div>

          {/* Step 3: Service Selection (Strict Max 3 Services) */}
          <div className="space-y-3 pt-2 border-t border-charcoal-600">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
                  3. {t('label_select_services')} <span className="text-gold">*</span>
                </label>
                <p className="text-xs text-gray-400 mt-0.5">
                  {t('services_max_hint')}
                </p>
              </div>

              {/* Dynamic Service Selection Counter */}
              <Badge
                variant={selectedServices.length === 3 ? 'gold' : 'waiting'}
                size="md"
              >
                {selectedServices.length} / 3 {t('services_selected_badge')}
              </Badge>
            </div>

            {/* Invariant 03 warning when 3 services selected */}
            {selectedServices.length >= 3 && (
              <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-600/50 text-amber-300 text-xs flex items-center gap-2">
                <ShieldAlert size={16} className="text-amber-400 flex-shrink-0" />
                <span>{t('max_services_reached')}</span>
              </div>
            )}

            {errors.services && (
              <p className="text-xs text-red-400 flex items-center gap-1.5">
                <AlertCircle size={13} />
                <span>{errors.services}</span>
              </p>
            )}

            {/* Services Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {activeServices.map((service) => {
                const isSelected = selectedServices.some((s) => s.id === service.id);
                const isMaxReached = selectedServices.length >= 3 && !isSelected;

                return (
                  <div
                    key={service.id}
                    onClick={() => !isMaxReached && handleToggleService(service)}
                    className={`p-3.5 rounded-xl border-2 transition-all flex flex-col justify-between select-none ${
                      isSelected
                        ? 'bg-charcoal-700/90 border-gold shadow-gold-glow cursor-pointer'
                        : isMaxReached
                        ? 'bg-charcoal-800/60 border-charcoal-700 opacity-40 cursor-not-allowed'
                        : 'bg-charcoal-700/60 border-charcoal-600 hover:border-gold/50 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5">
                          {isSelected ? (
                            <CheckCircle2 size={18} className="text-gold" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-gray-500 mt-0.5"></div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-100">
                            {language === 'gu' ? service.nameGu : service.nameEn}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">
                            {language === 'gu' && service.descriptionGu
                              ? service.descriptionGu
                              : service.descriptionEn}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-charcoal-600/70 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-gray-300 font-medium">
                        <Clock size={12} className="text-gray-400" />
                        {service.durationMinutes} {t('mins_short')}
                      </span>
                      <span className="flex items-center font-bold text-gold">
                        <IndianRupee size={12} />
                        {service.priceInr}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 4: Barber Preference Selector */}
          <div className="space-y-3 pt-2 border-t border-charcoal-600">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
              4. {t('label_barber_pref')}
            </label>

            <div className="space-y-2.5">
              {/* Option 1: Any Available Barber (Fastest) */}
              <label
                className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  barberPreference === 'ANY'
                    ? 'bg-charcoal-700/90 border-gold shadow-gold-glow'
                    : 'bg-charcoal-700/50 border-charcoal-600 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="barberPref"
                    value="ANY"
                    checked={barberPreference === 'ANY'}
                    onChange={() => setBarberPreference('ANY')}
                    className="accent-gold w-4 h-4"
                  />
                  <div>
                    <p className="text-sm font-bold text-gray-100 flex items-center gap-1.5">
                      <span>{t('pref_any_barber')}</span>
                      <Sparkles size={13} className="text-gold" />
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {language === 'gu'
                        ? 'જે ખુરશી પહેલા ખાલી થશે ત્યાં તમારો વારો આવશે'
                        : 'First chair to become free will serve you'}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-1 rounded-md border border-emerald-600/50">
                  ~{getBarberWaitMins('ANY')} {t('mins_short')}
                </span>
              </label>

              {/* Option 2..N: Specific Barbers */}
              {barbers.map((barber) => {
                const wait = getBarberWaitMins(barber.id);
                const isSelected = barberPreference === barber.id;

                return (
                  <label
                    key={barber.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-charcoal-700/90 border-gold shadow-gold-glow'
                        : 'bg-charcoal-700/50 border-charcoal-600 hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="barberPref"
                        value={barber.id}
                        checked={isSelected}
                        onChange={() => setBarberPreference(barber.id)}
                        className="accent-gold w-4 h-4"
                      />
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{barber.avatar || '✂️'}</span>
                        <div>
                          <p className="text-sm font-bold text-gray-100">
                            {language === 'gu' && barber.nameGu ? barber.nameGu : barber.name}
                            <span className="text-xs font-normal text-gray-400 ml-2">
                              ({t('chair_num')} {barber.chairNumber})
                            </span>
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {language === 'gu' && barber.specialtiesGu
                              ? barber.specialtiesGu
                              : barber.specialtiesEn}
                          </p>
                        </div>
                      </div>
                    </div>

                    <span className="text-xs font-mono font-bold text-gray-300">
                      ~{wait} {t('mins_short')}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Live Summary Bar: Price, Duration & Wait Time */}
          <div className="p-4 rounded-2xl bg-charcoal-800 border-2 border-gold/40 shadow-inner grid grid-cols-3 gap-2 text-center divide-x divide-charcoal-600">
            <div className="px-2">
              <p className="text-[10px] sm:text-xs text-gray-400 uppercase font-semibold">
                {t('est_summary_wait')}
              </p>
              <p className="text-base sm:text-2xl font-black text-gold font-mono mt-1">
                ~{estimatedWaitMins} {t('mins_short')}
              </p>
              <p className="text-[10px] text-gray-400">
                {t('est_seat_time_label')}: {estimatedSeatTime}
              </p>
            </div>

            <div className="px-2">
              <p className="text-[10px] sm:text-xs text-gray-400 uppercase font-semibold">
                {t('est_summary_duration')}
              </p>
              <p className="text-base sm:text-2xl font-black text-gray-100 font-mono mt-1">
                {totalDuration} {t('mins_short')}
              </p>
              <p className="text-[10px] text-gray-400">
                {selectedServices.length} {t('services_selected_badge')}
              </p>
            </div>

            <div className="px-2">
              <p className="text-[10px] sm:text-xs text-gray-400 uppercase font-semibold">
                {t('est_summary_total')}
              </p>
              <p className="text-base sm:text-2xl font-black text-emerald-400 font-mono mt-1">
                ₹{totalPrice}
              </p>
              <p className="text-[10px] text-emerald-400">
                Pay at reception
              </p>
            </div>
          </div>

          {/* Invariant 07 & 06 Reminder */}
          <div className="p-3 rounded-xl bg-charcoal-700/50 border border-charcoal-600 flex items-start gap-2 text-[11px] text-gray-400">
            <Info size={14} className="text-gold mt-0.5 flex-shrink-0" />
            <span>
              {language === 'gu'
                ? 'ટોકન મેળવ્યા પછી સ્ટેટસ પેજ પર લાઈવ સ્થાન જોઈ શકાશે. બોલાવ્યા પછી ૧૦ મિનિટમાં ખુરશી પર પહોંચવું અનિવાર્ય છે.'
                : 'After joining, monitor your live turn on My Status. You have 10:00 minutes to report once called.'}
            </span>
          </div>

          {/* Submit CTA */}
          <Button
            type="submit"
            size="lg"
            fullWidth
            isLoading={isSubmitting}
            disabled={!isOnlineQueueOpen || isSubmitting}
            className="gap-2.5 text-base sm:text-lg py-4"
          >
            <Scissors size={20} className="stroke-[2.5]" />
            <span>{isSubmitting ? t('btn_joining') : t('btn_confirm_join')}</span>
          </Button>
        </form>
      </Card>
    </div>
  );
};
