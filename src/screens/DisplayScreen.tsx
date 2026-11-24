import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useQueue } from '../context/QueueContext';
import { Badge } from '../components/ui/Badge';
import {
  Scissors,
  Volume2,
  VolumeX,
  QrCode,
  Sparkles,
  BellRing,
  ArrowLeft
} from 'lucide-react';

export const DisplayScreen: React.FC = () => {
  const { t, language } = useLanguage();
  const { barbers, queue } = useQueue();

  // Current live clock
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Audio Chime State
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const prevCalledTokensRef = useRef<string[]>([]);

  // Function to play luxury two-tone chime (C5 -> E5)
  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + start);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + start);
        osc.stop(audioCtx.currentTime + start + duration);
      };
      playTone(523.25, 0, 0.4);
      playTone(659.25, 0.25, 0.6);
    } catch (e) {
      console.warn('AudioContext requires user gesture or browser permission', e);
    }
  };

  // Monitor newly called tokens and trigger audio chime
  useEffect(() => {
    const currentlyCalled = queue
      .filter((t) => t.status === 'CALLED')
      .map((t) => t.id);

    // If there is a new called token that wasn't in prevCalledTokensRef, play chime!
    const newlyCalled = currentlyCalled.filter((id) => !prevCalledTokensRef.current.includes(id));
    if (newlyCalled.length > 0 && isAudioEnabled) {
      playChime();
    }
    prevCalledTokensRef.current = currentlyCalled;
  }, [queue, isAudioEnabled]);

  // Next five customer tokens in queue (sorted chronologically by FCFS)
  const nextFiveCustomers = useMemo(() => {
    return queue
      .filter((t) => t.status === 'WAITING' || t.status === 'UP_NEXT' || t.status === 'CALLED')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(0, 5);
  }, [queue]);

  // Rotating bilingual ticker
  const [tickerIndex, setTickerIndex] = useState(0);
  const tickerMessages = [
    t('tv_ticker_message'),
    language === 'gu'
      ? 'રોયલ ટચ ગ્રૂમિંગમાં આપનું સ્વાગત છે • સ્વચ્છ અને વ્યવસ્થિત સેવા'
      : 'Royal Touch Grooming • Premium Men\'s Grooming Lounge & Spa',
    language === 'gu'
      ? 'કતારમાં જોડાવા માટે તમારા મોબાઈલથી નીચેનો QR કોડ સ્કેન કરો'
      : 'Scan the QR code below on your phone to join the live queue directly',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % tickerMessages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [tickerMessages.length]);

  return (
    <div className="w-full min-h-[88vh] bg-charcoal-900 rounded-3xl border-2 border-charcoal-600 p-5 sm:p-8 flex flex-col justify-between shadow-2xl animate-fadeIn">
      {/* 1. TV Signage Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-5 border-b border-charcoal-700">
        <div className="flex items-center gap-3.5">
          <Link
            to="/"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-onyx hover:bg-gold/20 border border-charcoal-600 hover:border-gold text-xs font-bold text-gray-300 hover:text-gold transition-all shadow-sm group mr-1"
            title="Exit TV Display Mode"
            aria-label="Back to Salon"
          >
            <ArrowLeft size={16} className="text-gold group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline">{language === 'gu' ? 'પાછા જાઓ' : 'Back'}</span>
          </Link>

          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold-light via-gold to-gold-dark flex items-center justify-center text-onyx shadow-gold-glow">
            <Scissors size={26} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-100 tracking-wide">
                {t('brand_name')}
              </h1>
              <Sparkles size={16} className="text-gold" />
            </div>
            <p className="text-xs text-gold font-medium">
              {t('brand_tagline')}
            </p>
          </div>
        </div>

        {/* Right Indicators: Audio chime toggle + Live clock */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              setIsAudioEnabled(!isAudioEnabled);
              if (!isAudioEnabled) playChime();
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-onyx border border-charcoal-600 text-xs text-gray-300 hover:text-white transition-colors"
          >
            {isAudioEnabled ? (
              <>
                <Volume2 size={16} className="text-gold animate-bounce" />
                <span className="font-semibold">{t('tv_audio_enabled')}</span>
              </>
            ) : (
              <>
                <VolumeX size={16} className="text-gray-500" />
                <span className="text-gray-400">Audio Muted</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={playChime}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-charcoal-800 border border-charcoal-600 text-xs text-gold hover:bg-charcoal-700 font-semibold"
          >
            <BellRing size={13} />
            <span>{t('tv_audio_test')}</span>
          </button>

          <div className="text-2xl sm:text-3xl font-mono font-bold text-gray-100 tracking-wider">
            {currentTime}
          </div>
        </div>
      </div>

      {/* 2. Main 16:9 Landscape Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-6 flex-1 items-start">
        {/* Left Side: NOW SERVING (Barber Stations) */}
        <div className="bg-onyx/95 rounded-2xl border-2 border-emerald-600/40 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-charcoal-700">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
              <h2 className="text-xl sm:text-2xl font-black text-emerald-400 tracking-wider">
                {t('tv_now_serving')}
              </h2>
            </div>
            <Badge variant="in_service" size="sm" pulse>Live Chairs</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {barbers.map((barber) => {
              const activeToken = queue.find(
                (t) =>
                  t.assignedBarberId === barber.id &&
                  (t.status === 'IN_SERVICE' || t.status === 'CALLED')
              );
              const isCalled = activeToken?.status === 'CALLED';
              const isServing = activeToken?.status === 'IN_SERVICE';

              return (
                <div
                  key={barber.id}
                  className={`p-4 rounded-2xl bg-charcoal-800/90 border-2 transition-all flex flex-col justify-between ${isCalled
                    ? 'border-gold shadow-gold-glow-lg animate-pulse'
                    : isServing
                      ? 'border-emerald-600/50 shadow-sm'
                      : 'border-charcoal-700 opacity-80'
                    }`}
                >
                  {/* Barber Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-charcoal-700/80">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{barber.avatar || '✂️'}</span>
                      <div>
                        <p className="font-bold text-sm text-gray-100">
                          {language === 'gu' && barber.nameGu ? barber.nameGu : barber.name}
                        </p>
                        <p className="text-[11px] text-gold font-semibold">
                          Chair {barber.chairNumber}
                        </p>
                      </div>
                    </div>

                    <div>
                      {isCalled && <Badge variant="up_next" size="sm" pulse>CALLED</Badge>}
                      {isServing && <Badge variant="in_service" size="sm">IN CHAIR</Badge>}
                      {!activeToken && <Badge variant="gold" size="sm">READY</Badge>}
                    </div>
                  </div>

                  {/* Customer Token Callout */}
                  <div className="my-3 text-center space-y-1">
                    {activeToken ? (
                      <>
                        <p className="text-3xl sm:text-4xl font-black text-gold font-mono tracking-wider">
                          #{activeToken.id}
                        </p>
                        <p className="text-sm font-bold text-gray-100">
                          {activeToken.customerName}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate">
                          {activeToken.services.map((s) => (language === 'gu' ? s.nameGu : s.nameEn)).join(' • ')}
                        </p>
                      </>
                    ) : (
                      <div className="py-2 space-y-1">
                        <p className="text-lg font-bold text-emerald-400">
                          {t('tv_chair_ready')}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {barber.status === 'ON_BREAK' ? 'On 15m break' : 'Next patron can take chair'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer Notice */}
                  {isCalled && (
                    <div className="p-1.5 rounded-lg bg-gold/10 border border-gold/40 text-center">
                      <p className="text-[11px] font-bold text-gold">
                        Please proceed to Chair {barber.chairNumber}!
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: UP NEXT (Next 5 Customers in Queue) */}
        <div className="bg-onyx/95 rounded-2xl border-2 border-amber-600/40 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-charcoal-700">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse"></span>
              <h2 className="text-xl sm:text-2xl font-black text-amber-400 tracking-wider">
                {t('tv_up_next')}
              </h2>
            </div>
            <span className="text-xs text-gray-400 font-semibold">
              {nextFiveCustomers.length} on deck
            </span>
          </div>

          {nextFiveCustomers.length === 0 ? (
            <div className="py-12 text-center text-gray-400 italic">
              {t('tv_no_next_patrons')}
            </div>
          ) : (
            <div className="space-y-3">
              {nextFiveCustomers.map((cust, idx) => {
                const isCalled = cust.status === 'CALLED';
                const preferredBarber = barbers.find((b) => b.id === cust.barberPreference);

                return (
                  <div
                    key={cust.id}
                    className={`p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between ${isCalled
                      ? 'bg-charcoal-800/90 border-gold shadow-gold-glow animate-pulse'
                      : 'bg-charcoal-800/60 border-charcoal-700'
                      }`}
                  >
                    {/* Rank & Token */}
                    <div className="flex items-center gap-3.5">
                      <div className="w-8 h-8 rounded-xl bg-charcoal-700 border border-charcoal-600 flex items-center justify-center font-bold text-xs text-gray-300">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-gold text-xl sm:text-2xl">
                            #{cust.id}
                          </span>
                          {isCalled && (
                            <Badge variant="up_next" size="sm" pulse>
                              {t('tv_called_badge')} {cust.chairNumber}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-bold text-gray-100">
                          {cust.customerName}
                          <span className="text-xs text-gray-400 font-normal ml-2">
                            ({preferredBarber ? preferredBarber.name : 'Any Available'})
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Wait Time */}
                    <div className="text-right">
                      <span className="text-xs text-gray-400 block font-semibold uppercase">
                        {isCalled ? 'Grace Period' : 'Est. Wait'}
                      </span>
                      <span className={`font-mono font-bold text-base ${isCalled ? 'text-gold' : 'text-emerald-400'}`}>
                        {isCalled ? '10:00 mins' : `~${cust.estimatedWaitMinutes} mins`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. Bottom Ticker & Dynamic QR Code */}
      <div className="p-4 rounded-2xl bg-onyx border border-charcoal-600 flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-charcoal-700 border border-charcoal-600 flex items-center justify-center text-gold shadow-inner flex-shrink-0">
            <QrCode size={26} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-100 flex items-center gap-1.5">
              <span>{t('tv_scan_to_join')}</span>
              <Sparkles size={14} className="text-gold" />
            </p>
            <p className="text-xs text-gray-400">
              Instant digital queue ticket with real-time status updates on your smartphone
            </p>
          </div>
        </div>

        {/* Smooth cycling ticker */}
        <div className="text-xs text-gray-300 font-medium italic text-center sm:text-right max-w-lg transition-opacity duration-500">
          "{tickerMessages[tickerIndex]}"
        </div>
      </div>
    </div>
  );
};
