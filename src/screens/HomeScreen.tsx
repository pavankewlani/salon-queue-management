import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useQueue } from '../context/QueueContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Users,
  Clock,
  Scissors,
  Sparkles,
  ArrowRight,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  PhoneCall,
  CalendarCheck
} from 'lucide-react';

export const HomeScreen: React.FC = () => {
  const { t, language } = useLanguage();
  const { activeWaitingCount, estimatedGeneralWaitMins, barbers, isOnlineQueueOpen, findTokenByQuery } = useQueue();
  const navigate = useNavigate();

  // Track Token Modal State
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState('');

  const handleTrackSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    if (!searchQuery.trim()) {
      setSearchError(t('track_modal_placeholder'));
      return;
    }
    const token = findTokenByQuery(searchQuery);
    if (token) {
      setIsTrackModalOpen(false);
      navigate(`/status/${token.id}`);
    } else {
      setSearchError(t('track_modal_not_found'));
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-10">
      {/* 1. Hero & Brand Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 pt-2 sm:pt-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-onyx border border-gold/40 text-gold text-xs font-semibold shadow-gold-glow">
          <Sparkles size={14} className="text-gold" />
          <span>{t('brand_tagline')}</span>
        </div>

        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold-light via-gold to-gold-dark flex items-center justify-center text-onyx shadow-gold-glow">
            <Scissors size={26} className="stroke-[2.5]" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-gray-100">
            {t('brand_name')}
          </h1>
        </div>

        <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto leading-relaxed">
          {t('home_subtitle')}
        </p>
      </div>

      {/* 2. Operational Status & Live Metrics (Mobile-first Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {/* Salon Open / Cutoff Status */}
        <Card hoverGlow className="text-center py-5 flex flex-col justify-center items-center">
          <div className="flex items-center justify-center w-11 h-11 rounded-full bg-emerald-950/80 border border-emerald-600/40 text-emerald-400 mb-2">
            <CalendarCheck size={22} />
          </div>
          <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
            {language === 'gu' ? 'સલૂન સ્થિતિ' : 'Salon Status'}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xl font-extrabold text-emerald-400">
              {t('salon_status_open')}
            </span>
          </div>
          <span className="text-[11px] text-gray-400 mt-1">
            {isOnlineQueueOpen ? t('online_queue_open') : t('online_queue_closed')}
          </span>
        </Card>

        {/* Current Waiting Count */}
        <Card hoverGlow className="text-center py-5 flex flex-col justify-center items-center">
          <div className="flex items-center justify-center w-11 h-11 rounded-full bg-gold/10 border border-gold/30 text-gold mb-2">
            <Users size={22} />
          </div>
          <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
            {t('active_in_line')}
          </p>
          <p className="text-3xl sm:text-4xl font-extrabold text-gold mt-1 font-mono">
            {activeWaitingCount}
            <span className="text-xs font-normal text-gray-400 ml-1.5">
              {language === 'gu' ? 'ગ્રાહકો' : 'Patrons'}
            </span>
          </p>
          <span className="text-[11px] text-gray-400 mt-1">
            {language === 'gu' ? 'કતારમાં પ્રતીક્ષારત' : 'Currently waiting'}
          </span>
        </Card>

        {/* Estimated Wait Time */}
        <Card hoverGlow className="text-center py-5 flex flex-col justify-center items-center">
          <div className="flex items-center justify-center w-11 h-11 rounded-full bg-charcoal-700 border border-charcoal-500 text-gold mb-2">
            <Clock size={22} />
          </div>
          <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
            {t('avg_wait_time')}
          </p>
          <p className="text-3xl sm:text-4xl font-extrabold text-gray-100 mt-1 font-mono">
            ~{estimatedGeneralWaitMins}
            <span className="text-xs font-normal text-gray-400 ml-1.5">
              {t('mins_short')}
            </span>
          </p>
          <span className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 size={12} />
            {language === 'gu' ? 'સૌથી ઝડપી વારો' : 'Fastest available chair'}
          </span>
        </Card>
      </div>

      {/* 3. Primary Customer Action CTAs */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto pt-2">
        <Link to="/join" className="w-full">
          <Button size="lg" fullWidth className="gap-2.5 text-base sm:text-lg py-4">
            <Scissors size={20} className="stroke-[2.5]" />
            <span>{t('btn_join_queue')}</span>
            <ArrowRight size={18} />
          </Button>
        </Link>
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          className="gap-2 text-sm sm:text-base py-4"
          onClick={() => setIsTrackModalOpen(true)}
        >
          <Search size={18} />
          <span>{t('btn_track_token')}</span>
        </Button>
      </div>

      {/* 4. Barber Availability Cards Section */}
      <div className="max-w-4xl mx-auto space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-charcoal-600">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-100 flex items-center gap-2">
              <Scissors size={20} className="text-gold" />
              <span>{t('active_barbers_title')}</span>
            </h2>
            <p className="text-xs text-gray-400">{t('active_barbers_subtitle')}</p>
          </div>
          <span className="text-xs font-semibold text-gold bg-gold/10 px-2.5 py-1 rounded-full border border-gold/30 self-start sm:self-auto">
            {barbers.filter((b) => b.status === 'IDLE').length} {language === 'gu' ? 'ખુરશીઓ ઉપલબ્ધ' : 'Chairs Ready'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {barbers.map((barber) => {
            const isIdle = barber.status === 'IDLE';
            const isServing = barber.status === 'IN_SERVICE';
            const isOnBreak = barber.status === 'ON_BREAK';

            return (
              <div
                key={barber.id}
                className={`p-4 rounded-2xl bg-onyx border transition-all duration-200 ${
                  isIdle
                    ? 'border-emerald-600/50 shadow-sm'
                    : isServing
                    ? 'border-charcoal-600 hover:border-gold/40'
                    : 'border-charcoal-600 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-charcoal-700 border border-charcoal-600 flex items-center justify-center text-2xl shadow-inner">
                      {barber.avatar || '✂️'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-gray-100">
                          {language === 'gu' && barber.nameGu ? barber.nameGu : barber.name}
                        </h3>
                        <span className="text-[11px] font-semibold text-gold bg-charcoal-700 px-2 py-0.5 rounded-md">
                          {t('chair_num')} {barber.chairNumber}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {language === 'gu' && barber.specialtiesGu
                          ? barber.specialtiesGu
                          : barber.specialtiesEn}
                      </p>
                    </div>
                  </div>

                  <div>
                    {isIdle && (
                      <Badge variant="in_service" size="sm" pulse>
                        {language === 'gu' ? 'ઉપલબ્ધ' : 'Ready'}
                      </Badge>
                    )}
                    {isServing && (
                      <Badge variant="waiting" size="sm">
                        {language === 'gu' ? 'સેવા શરૂ છે' : 'In Chair'}
                      </Badge>
                    )}
                    {isOnBreak && (
                      <Badge variant="no_show" size="sm">
                        {language === 'gu' ? 'બ્રેક પર' : 'Break'}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="mt-3.5 pt-3 border-t border-charcoal-700/80 flex items-center justify-between text-xs">
                  <span className="text-gray-400">
                    {isServing && barber.currentCustomerName ? (
                      <span className="text-gray-300">
                        {language === 'gu' ? 'હાલમાં ગ્રાહક' : 'Serving'}: <strong className="text-gold">{barber.currentCustomerName}</strong>
                      </span>
                    ) : isIdle ? (
                      <span className="text-emerald-400 font-medium">
                        {t('ready_to_seat')}
                      </span>
                    ) : (
                      <span className="text-amber-400">15-min scheduled break</span>
                    )}
                  </span>

                  <span className="font-mono font-bold text-gray-200">
                    {t('current_wait_prefix')}:{' '}
                    <span className={isIdle ? 'text-emerald-400' : 'text-gold'}>
                      ~{barber.currentWaitMins || (isIdle ? 0 : 15)} {t('mins_short')}
                    </span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Invariant Trust Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-4xl mx-auto pt-2 text-xs">
        <div className="p-3.5 rounded-xl bg-onyx border border-charcoal-600 flex items-start gap-2.5">
          <ShieldCheck size={18} className="text-gold mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-bold text-gray-200">
              {language === 'gu' ? 'FCFS કતાર ક્રમ' : 'First-Come, First-Served'}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {t('invariant_fcfs_rule')}
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-onyx border border-charcoal-600 flex items-start gap-2.5">
          <Clock size={18} className="text-gold mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-bold text-gray-200">
              {language === 'gu' ? '૧૦ મિનિટ નો-શો નિયમ' : '10-Minute Grace Window'}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {language === 'gu'
                ? 'બોલાવ્યા પછી ૧૦ મિનિટમાં ખુરશી પર પહોંચવું અનિવાર્ય છે.'
                : 'Called patrons have 10:00 mins to take the chair.'}
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-onyx border border-charcoal-600 flex items-start gap-2.5">
          <PhoneCall size={18} className="text-gold mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-bold text-gray-200">
              {language === 'gu' ? '૧ નંબર = ૧ એક્ટિવ ટોકન' : '1 Token Per Phone'}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {t('invariant_phone_rule')}
            </p>
          </div>
        </div>
      </div>

      {/* 6. Track Existing Token Modal */}
      {isTrackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-onyx rounded-2xl border-2 border-gold/50 shadow-gold-glow p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-charcoal-600">
              <div className="flex items-center gap-2 text-gold">
                <Search size={20} />
                <h3 className="font-bold text-base sm:text-lg text-gray-100">
                  {t('track_modal_title')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsTrackModalOpen(false);
                  setSearchError('');
                }}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-charcoal-700"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-300">
              {t('track_modal_desc')}
            </p>

            <form onSubmit={handleTrackSearch} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('track_modal_placeholder')}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-xl px-4 py-3 text-sm text-gray-100 font-mono focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                  autoFocus
                />
                {searchError && (
                  <p className="mt-2 text-xs text-red-400 flex items-center gap-1.5">
                    <AlertCircle size={14} className="flex-shrink-0" />
                    <span>{searchError}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => {
                    setIsTrackModalOpen(false);
                    setSearchError('');
                  }}
                >
                  {t('track_modal_close')}
                </Button>
                <Button type="submit" size="md">
                  {t('track_modal_btn')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
