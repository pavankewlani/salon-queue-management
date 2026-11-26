import React, { useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useQueue } from '../context/QueueContext';
import { ServiceItem, BarberStation } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Settings,
  Scissors,
  Users,
  Clock,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Coffee,
  UserCheck,
  TrendingUp,
  IndianRupee,
  UserX,
  X,
  Lock,
  Unlock,
  Sparkles,
  Save,
  Check,
  Database,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { isSupabaseConfigured, checkSupabaseConnection, SupabaseConnectionStatus } from '../lib/supabase';

export const AdminScreen: React.FC = () => {
  const { t, language } = useLanguage();
  const {
    services,
    barbers,
    queue,
    salonConfig,
    isOnlineQueueOpen,
    addService,
    updateService,
    toggleServiceStatus,
    deleteService,
    updateBarber,
    setBarberOnDuty,
    setBarberOnBreak,
    addBarber,
    updateSalonConfig,
    setOnlineQueueForceStatus,
    isAutoAcceptActive,
    toggleAutoAccept,
    todayServedCount,
    todayNoShowCount,
    todayAvgWaitMins,
    todayTotalRevenue,
  } = useQueue();

  const [activeTab, setActiveTab] = useState<'rules' | 'services' | 'barbers' | 'analytics' | 'database'>('services');

  // Supabase connection monitor
  const [dbStatus, setDbStatus] = useState<SupabaseConnectionStatus | null>(null);
  const [isCheckingDb, setIsCheckingDb] = useState(false);

  const handleCheckDb = async () => {
    setIsCheckingDb(true);
    try {
      const res = await checkSupabaseConnection();
      setDbStatus(res);
    } finally {
      setIsCheckingDb(false);
    }
  };

  // Initial check on mount (only when configured in browser mode)
  React.useEffect(() => {
    if (!isSupabaseConfigured) return;
    handleCheckDb();
  }, []);

  // Success / Notice toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ----------------------------------------------------
  // Tab 1: Operating Rules & Queue Control State
  // ----------------------------------------------------
  const [openingTime, setOpeningTime] = useState(salonConfig.openingTime || '09:00');
  const [closingTime, setClosingTime] = useState(salonConfig.closingTime || '21:00');
  const [cutoffMinutes, setCutoffMinutes] = useState(
    salonConfig.onlineCutoffMinutesBeforeClosing || 30
  );

  const calculatedCutoffTime = useMemo(() => {
    try {
      const [closeHour, closeMin] = closingTime.split(':').map(Number);
      const totalMinutes = closeHour * 60 + closeMin - cutoffMinutes;
      const cutoffH = Math.floor(totalMinutes / 60);
      const cutoffM = totalMinutes % 60;
      const period = cutoffH >= 12 ? 'PM' : 'AM';
      const displayH = cutoffH % 12 || 12;
      return `${String(displayH).padStart(2, '0')}:${String(cutoffM).padStart(2, '0')} ${period}`;
    } catch {
      return '08:30 PM';
    }
  }, [closingTime, cutoffMinutes]);

  const handleSaveHours = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSalonConfig({
      openingTime,
      closingTime,
      onlineCutoffMinutesBeforeClosing: Number(cutoffMinutes),
    });
    showToast('Operating hours and cutoff settings updated and persisted.');
  };

  // ----------------------------------------------------
  // Tab 2: Service Management Modal State
  // ----------------------------------------------------
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState({
    nameEn: '',
    nameGu: '',
    durationMinutes: 30,
    priceInr: 250,
    category: 'hair' as 'hair' | 'beard' | 'spa' | 'skin',
    descriptionEn: '',
    descriptionGu: '',
    isActive: true,
  });

  const handleOpenAddService = () => {
    setEditingServiceId(null);
    setServiceForm({
      nameEn: '',
      nameGu: '',
      durationMinutes: 30,
      priceInr: 250,
      category: 'hair',
      descriptionEn: '',
      descriptionGu: '',
      isActive: true,
    });
    setIsServiceModalOpen(true);
  };

  const handleOpenEditService = (service: ServiceItem) => {
    setEditingServiceId(service.id);
    setServiceForm({
      nameEn: service.nameEn,
      nameGu: service.nameGu,
      durationMinutes: service.durationMinutes,
      priceInr: service.priceInr,
      category: service.category || 'hair',
      descriptionEn: service.descriptionEn || '',
      descriptionGu: service.descriptionGu || '',
      isActive: service.isActive,
    });
    setIsServiceModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.nameEn.trim()) return;

    if (editingServiceId) {
      await updateService(editingServiceId, {
        nameEn: serviceForm.nameEn.trim(),
        nameGu: serviceForm.nameGu.trim() || serviceForm.nameEn.trim(),
        durationMinutes: Number(serviceForm.durationMinutes),
        priceInr: Number(serviceForm.priceInr),
        category: serviceForm.category,
        descriptionEn: serviceForm.descriptionEn.trim(),
        descriptionGu: serviceForm.descriptionGu.trim(),
        isActive: serviceForm.isActive,
      });
      showToast(`Service "${serviceForm.nameEn}" updated successfully.`);
    } else {
      await addService({
        nameEn: serviceForm.nameEn.trim(),
        nameGu: serviceForm.nameGu.trim() || serviceForm.nameEn.trim(),
        durationMinutes: Number(serviceForm.durationMinutes),
        priceInr: Number(serviceForm.priceInr),
        category: serviceForm.category,
        descriptionEn: serviceForm.descriptionEn.trim(),
        descriptionGu: serviceForm.descriptionGu.trim(),
        isActive: serviceForm.isActive,
      });
      showToast(`New service "${serviceForm.nameEn}" added to catalog.`);
    }
    setIsServiceModalOpen(false);
  };

  // ----------------------------------------------------
  // Tab 3: Barber Management Modal State
  // ----------------------------------------------------
  const [isBarberModalOpen, setIsBarberModalOpen] = useState(false);
  const [editingBarberId, setEditingBarberId] = useState<string | null>(null);
  const [barberForm, setBarberForm] = useState({
    name: '',
    nameGu: '',
    chairNumber: 1,
    shiftStart: '09:00',
    shiftEnd: '18:00',
    specialtiesEn: '',
    specialtiesGu: '',
    avatar: '👨‍🦱',
  });

  const handleOpenAddBarber = () => {
    setEditingBarberId(null);
    setBarberForm({
      name: '',
      nameGu: '',
      chairNumber: barbers.length + 1,
      shiftStart: '09:00',
      shiftEnd: '18:00',
      specialtiesEn: 'Precision Cuts, Styling',
      specialtiesGu: 'કટ્સ અને સ્ટાઇલિંગ',
      avatar: '✂️',
    });
    setIsBarberModalOpen(true);
  };

  const handleOpenEditBarber = (barber: BarberStation) => {
    setEditingBarberId(barber.id);
    setBarberForm({
      name: barber.name,
      nameGu: barber.nameGu || '',
      chairNumber: barber.chairNumber,
      shiftStart: barber.shiftStart,
      shiftEnd: barber.shiftEnd,
      specialtiesEn: barber.specialtiesEn || '',
      specialtiesGu: barber.specialtiesGu || '',
      avatar: barber.avatar || '✂️',
    });
    setIsBarberModalOpen(true);
  };

  const handleSaveBarber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barberForm.name.trim()) return;

    if (editingBarberId) {
      await updateBarber(editingBarberId, {
        name: barberForm.name.trim(),
        nameGu: barberForm.nameGu.trim() || barberForm.name.trim(),
        chairNumber: Number(barberForm.chairNumber),
        shiftStart: barberForm.shiftStart,
        shiftEnd: barberForm.shiftEnd,
        specialtiesEn: barberForm.specialtiesEn.trim(),
        specialtiesGu: barberForm.specialtiesGu.trim(),
        avatar: barberForm.avatar,
      });
      showToast(`Barber ${barberForm.name} updated successfully.`);
    } else {
      await addBarber({
        name: barberForm.name.trim(),
        nameGu: barberForm.nameGu.trim() || barberForm.name.trim(),
        chairNumber: Number(barberForm.chairNumber),
        status: 'IDLE',
        shiftStart: barberForm.shiftStart,
        shiftEnd: barberForm.shiftEnd,
        specialtiesEn: barberForm.specialtiesEn.trim(),
        specialtiesGu: barberForm.specialtiesGu.trim(),
        avatar: barberForm.avatar,
      });
      showToast(`Barber ${barberForm.name} added to roster.`);
    }
    setIsBarberModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-600/50 text-emerald-300 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-charcoal-600">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/40 flex items-center justify-center text-gold shadow-sm">
              <Settings size={22} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-100 flex items-center gap-2">
                <span>{t('admin_title')}</span>
                <Badge variant="gold" size="sm">Screen 7</Badge>
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Salon owner administration console • Catalog, staff, queue rules & analytics
              </p>
            </div>
          </div>
        </div>

        {/* Global Live Status indicator */}
        <div className="flex items-center gap-2">
          <Badge variant={isOnlineQueueOpen ? 'in_service' : 'waiting'} size="md" pulse={isOnlineQueueOpen}>
            {isOnlineQueueOpen ? 'Online Queue Open' : 'Online Queue Closed'}
          </Badge>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-charcoal-700">
        <button
          type="button"
          onClick={() => setActiveTab('services')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'services'
              ? 'bg-gold text-onyx shadow-gold-glow'
              : 'bg-onyx text-gray-300 hover:text-white border border-charcoal-600'
          }`}
        >
          <Scissors size={15} />
          <span>{t('admin_tab_services')}</span>
          <span className="text-[10px] bg-charcoal-700/80 px-1.5 py-0.5 rounded-full">
            {services.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('barbers')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'barbers'
              ? 'bg-gold text-onyx shadow-gold-glow'
              : 'bg-onyx text-gray-300 hover:text-white border border-charcoal-600'
          }`}
        >
          <Users size={15} />
          <span>{t('admin_tab_barbers')}</span>
          <span className="text-[10px] bg-charcoal-700/80 px-1.5 py-0.5 rounded-full">
            {barbers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'rules'
              ? 'bg-gold text-onyx shadow-gold-glow'
              : 'bg-onyx text-gray-300 hover:text-white border border-charcoal-600'
          }`}
        >
          <Clock size={15} />
          <span>{t('admin_tab_rules')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'bg-gold text-onyx shadow-gold-glow'
              : 'bg-onyx text-gray-300 hover:text-white border border-charcoal-600'
          }`}
        >
          <TrendingUp size={15} />
          <span>{t('admin_tab_analytics')}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('database');
            handleCheckDb();
          }}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'database'
              ? 'bg-gold text-onyx shadow-gold-glow'
              : 'bg-onyx text-gray-300 hover:text-white border border-charcoal-600'
          }`}
        >
          <Database size={15} />
          <span>Database & Cloud</span>
          {dbStatus && (
            <span
              className={`w-2 h-2 rounded-full ${
                dbStatus.isConnected ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
          )}
        </button>
      </div>

      {/* ==================================================== */}
      {/* TAB 1: SERVICE CATALOG MANAGEMENT                   */}
      {/* ==================================================== */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                <span>Manage Salon Services</span>
                <Sparkles size={16} className="text-gold" />
              </h2>
              <p className="text-xs text-gray-400">
                Configure service duration, prices, and enable/disable services. Disabled services automatically disappear from Join Queue.
              </p>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={handleOpenAddService}
              className="gap-1.5 py-2 text-xs"
            >
              <Plus size={14} />
              <span>{t('admin_add_service')}</span>
            </Button>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {services.map((service) => {
              const isActive = service.isActive !== false;

              return (
                <div
                  key={service.id}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                    isActive
                      ? 'bg-onyx/90 border-charcoal-600 shadow-sm'
                      : 'bg-charcoal-900/60 border-red-950/60 opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-base font-bold text-gray-100">
                          {language === 'gu' ? service.nameGu : service.nameEn}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {service.nameEn} • {service.nameGu}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">
                          {language === 'gu' && service.descriptionGu ? service.descriptionGu : service.descriptionEn}
                        </p>
                      </div>

                      <Badge variant={isActive ? 'in_service' : 'waiting'} size="sm">
                        {isActive ? t('admin_service_active') : t('admin_service_disabled')}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-charcoal-700/80 text-xs">
                      <div className="flex items-center gap-1.5 text-gray-300">
                        <Clock size={13} className="text-gold" />
                        <span className="font-semibold">{service.durationMinutes} Mins</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold font-mono">
                        <IndianRupee size={13} />
                        <span>₹{service.priceInr}</span>
                      </div>
                      <div className="text-[11px] text-gray-400 uppercase tracking-wider">
                        {service.category || 'hair'}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-charcoal-700/60">
                    {/* Toggle Active / Disabled Button */}
                    <button
                      type="button"
                      onClick={() => toggleServiceStatus(service.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        isActive
                          ? 'bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-700/50'
                          : 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/50'
                      }`}
                    >
                      {isActive ? (
                        <>
                          <Lock size={12} />
                          <span>{t('admin_service_toggle_disable')}</span>
                        </>
                      ) : (
                        <>
                          <Unlock size={12} />
                          <span>{t('admin_service_toggle_enable')}</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="slate"
                        onClick={() => handleOpenEditService(service)}
                        className="py-1 px-2.5 text-xs gap-1"
                      >
                        <Edit2 size={12} />
                        <span>{t('admin_edit_service')}</span>
                      </Button>
                      <button
                        type="button"
                        onClick={() => deleteService(service.id)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-charcoal-700 transition-colors"
                        title="Delete service"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: BARBERS & STAFF MANAGEMENT                   */}
      {/* ==================================================== */}
      {activeTab === 'barbers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                <span>Manage Stylists & Chairs</span>
                <Users size={16} className="text-gold" />
              </h2>
              <p className="text-xs text-gray-400">
                Set barbers on duty or on break, update shift hours, and manage chair assignments.
              </p>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={handleOpenAddBarber}
              className="gap-1.5 py-2 text-xs"
            >
              <Plus size={14} />
              <span>Add Barber</span>
            </Button>
          </div>

          {/* Barbers Roster Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {barbers.map((barber) => {
              const isOnBreak = barber.status === 'ON_BREAK';
              const isInService = barber.status === 'IN_SERVICE';
              const isIdle = barber.status === 'IDLE';

              return (
                <div
                  key={barber.id}
                  className="p-4 rounded-2xl bg-onyx/90 border border-charcoal-600 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-charcoal-700">
                      <div className="flex items-center gap-2.5">
                        <span className="text-3xl">{barber.avatar || '✂️'}</span>
                        <div>
                          <p className="text-base font-bold text-gray-100">
                            {language === 'gu' && barber.nameGu ? barber.nameGu : barber.name}
                          </p>
                          <p className="text-xs text-gold font-semibold">
                            Chair {barber.chairNumber} • Shift: {barber.shiftStart} - {barber.shiftEnd}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {language === 'gu' && barber.specialtiesGu ? barber.specialtiesGu : barber.specialtiesEn}
                          </p>
                        </div>
                      </div>

                      <Badge
                        variant={
                          isInService ? 'in_service' : isOnBreak ? 'waiting' : 'gold'
                        }
                        size="sm"
                      >
                        {barber.status}
                      </Badge>
                    </div>

                    {/* Current Customer or Chair Status */}
                    <div className="py-3 text-xs text-gray-300">
                      {isInService ? (
                        <p className="text-emerald-400 flex items-center gap-1.5 font-semibold">
                          <Scissors size={13} />
                          <span>Serving customer in chair (Mutex Active)</span>
                        </p>
                      ) : isOnBreak ? (
                        <p className="text-amber-400 flex items-center gap-1.5 font-semibold">
                          <Coffee size={13} />
                          <span>Currently on 15m break (Skipped by auto-assign)</span>
                        </p>
                      ) : (
                        <p className="text-gray-400 flex items-center gap-1.5">
                          <CheckCircle2 size={13} className="text-emerald-400" />
                          <span>Chair available and on floor duty</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Duty / Break Controls */}
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-charcoal-700">
                    <div className="flex items-center gap-2">
                      {/* Set On Duty */}
                      <button
                        type="button"
                        onClick={() => {
                          setBarberOnDuty(barber.id);
                          showToast(`${barber.name} marked On Duty.`);
                        }}
                        disabled={isIdle || isInService}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
                      >
                        <UserCheck size={12} />
                        <span>{t('admin_barber_set_duty')}</span>
                      </button>

                      {/* Set On Break */}
                      <button
                        type="button"
                        onClick={() => {
                          setBarberOnBreak(barber.id);
                          showToast(`${barber.name} marked On Break.`);
                        }}
                        disabled={isOnBreak || isInService}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-950/70 hover:bg-amber-900 border border-amber-600/50 text-amber-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
                      >
                        <Coffee size={12} />
                        <span>{t('admin_barber_set_break')}</span>
                      </button>
                    </div>

                    <Button
                      size="sm"
                      variant="slate"
                      onClick={() => handleOpenEditBarber(barber)}
                      className="py-1 px-2.5 text-xs gap-1"
                    >
                      <Edit2 size={12} />
                      <span>Edit</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 3: OPERATING RULES & QUEUE CONTROL              */}
      {/* ==================================================== */}
      {activeTab === 'rules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Master Online Queue Control Card */}
          <Card goldAccent title="Online Queue Master Toggle" subtitle="Immediate open / close override for online customer entry">
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-charcoal-800 border border-charcoal-600 flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-100 text-sm">Online Joining Status</p>
                  <p className="text-gray-400 mt-0.5">
                    {isOnlineQueueOpen
                      ? 'Customers can self-register at /join'
                      : 'Self-service registration is closed; walk-ins allowed at reception'}
                  </p>
                </div>
                <Badge variant={isOnlineQueueOpen ? 'in_service' : 'waiting'} size="md" pulse={isOnlineQueueOpen}>
                  {isOnlineQueueOpen ? 'OPEN' : 'CLOSED'}
                </Badge>
              </div>

              {/* Master Override Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setOnlineQueueForceStatus(true);
                    showToast('Online queue manually OPENED.');
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    salonConfig.forceOnlineQueueOpen === true
                      ? 'bg-emerald-900 text-emerald-100 border-emerald-400 shadow-sm'
                      : 'bg-charcoal-700 border-charcoal-600 text-gray-300 hover:text-white'
                  }`}
                >
                  {t('admin_online_queue_open_btn')}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOnlineQueueForceStatus(false);
                    showToast('Online queue manually CLOSED. Walk-ins remain allowed at reception.');
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    salonConfig.forceOnlineQueueOpen === false
                      ? 'bg-red-900 text-red-100 border-red-400 shadow-sm'
                      : 'bg-charcoal-700 border-charcoal-600 text-gray-300 hover:text-white'
                  }`}
                >
                  {t('admin_online_queue_close_btn')}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOnlineQueueForceStatus(null);
                    showToast('Online queue reset to Automatic Operating Hours schedule.');
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    salonConfig.forceOnlineQueueOpen === undefined || salonConfig.forceOnlineQueueOpen === null
                      ? 'bg-gold text-onyx border-gold shadow-sm'
                      : 'bg-charcoal-700 border-charcoal-600 text-gray-300 hover:text-white'
                  }`}
                >
                  {t('admin_online_queue_auto_btn')}
                </button>
              </div>

              {/* Invariant 09 note */}
              <div className="p-3 rounded-xl bg-onyx border border-charcoal-600 text-[11px] text-gray-400 flex items-start gap-2">
                <CheckCircle2 size={14} className="text-gold mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Invariant 09 (Walk-ins Allowed):</strong> Receptionists can register walk-in patrons at any time, even after online cutoff or closure.
                </span>
              </div>
            </div>
          </Card>

          {/* Autonomous Chair Service Mode */}
          <Card title="Autonomous Chair Mode" subtitle="Auto-Accept Next Patron & Auto-Finish Predefined Duration">
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-charcoal-700/80 border border-charcoal-600">
                <div>
                  <p className="font-bold text-gray-100">
                    Auto-Accept Next Waiting Customer
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    When active, idle chairs automatically accept the next eligible customer and begin service without manual button clicks.
                  </p>
                </div>
                <Badge variant={isAutoAcceptActive ? 'in_service' : 'waiting'} size="md" pulse={isAutoAcceptActive}>
                  {isAutoAcceptActive ? 'ENABLED' : 'PAUSED'}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={isAutoAcceptActive ? 'secondary' : 'primary'}
                  onClick={() => {
                    toggleAutoAccept();
                    showToast(isAutoAcceptActive ? 'Auto-Accept PAUSED' : 'Auto-Accept ENABLED');
                  }}
                  className="gap-1.5 py-2 text-xs"
                >
                  <Sparkles size={14} className={isAutoAcceptActive ? 'text-amber-400' : 'text-gold'} />
                  <span>{isAutoAcceptActive ? 'Pause Auto-Accept' : 'Enable Auto-Accept Mode'}</span>
                </Button>
              </div>
            </div>
          </Card>

          {/* Salon Operating Hours Configuration */}
          <Card title="Salon Operating Hours & 30m Cutoff" subtitle="Enforces Invariant 08">
            <form onSubmit={handleSaveHours} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-300 mb-1">
                  {t('admin_opening_time')}
                </label>
                <input
                  type="time"
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-xl px-3 py-2 text-gray-100 font-mono text-sm focus:outline-none focus:border-gold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">
                  {t('admin_closing_time')}
                </label>
                <input
                  type="time"
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-xl px-3 py-2 text-gray-100 font-mono text-sm focus:outline-none focus:border-gold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">
                  {t('admin_cutoff_label')}
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={cutoffMinutes}
                  onChange={(e) => setCutoffMinutes(Number(e.target.value))}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-xl px-3 py-2 text-gray-100 font-mono text-sm focus:outline-none focus:border-gold"
                  required
                />
              </div>

              {/* Dynamic Cutoff Computation */}
              <div className="p-3.5 rounded-xl bg-charcoal-800 border border-charcoal-600 text-xs space-y-1">
                <p className="font-bold text-gold flex items-center gap-1.5">
                  <Clock size={13} />
                  <span>Calculated Online Cutoff: {calculatedCutoffTime}</span>
                </p>
                <p className="text-[11px] text-gray-400">
                  Online queue closes automatically at {calculatedCutoffTime} ({cutoffMinutes} mins before closing).
                </p>
              </div>

              <Button type="submit" variant="primary" size="sm" fullWidth className="gap-2 py-2.5">
                <Save size={14} />
                <span>{t('admin_save_hours')}</span>
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 4: REAL-TIME ANALYTICS SUMMARY                   */}
      {/* ==================================================== */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Key KPI Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Today's Customers Served */}
            <Card hoverGlow className="text-center py-6">
              <div className="flex items-center justify-center w-11 h-11 rounded-full bg-gold/10 border border-gold/30 text-gold mx-auto mb-2">
                <UserCheck size={22} />
              </div>
              <p className="text-xs uppercase text-gray-400 font-semibold tracking-wider">
                {t('admin_metric_served')}
              </p>
              <p className="text-3xl sm:text-4xl font-extrabold text-gold mt-1 font-mono">
                {todayServedCount}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">Sessions finished today</p>
            </Card>

            {/* 2. Average Waiting Time */}
            <Card hoverGlow className="text-center py-6">
              <div className="flex items-center justify-center w-11 h-11 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto mb-2">
                <Clock size={22} />
              </div>
              <p className="text-xs uppercase text-gray-400 font-semibold tracking-wider">
                {t('admin_metric_avg_wait')}
              </p>
              <p className="text-3xl sm:text-4xl font-extrabold text-emerald-400 mt-1 font-mono">
                {todayAvgWaitMins} <span className="text-base font-normal">mins</span>
              </p>
              <p className="text-[11px] text-gray-400 mt-1">From entry to chair seating</p>
            </Card>

            {/* 3. No-Show Count */}
            <Card hoverGlow className="text-center py-6">
              <div className="flex items-center justify-center w-11 h-11 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 mx-auto mb-2">
                <UserX size={22} />
              </div>
              <p className="text-xs uppercase text-gray-400 font-semibold tracking-wider">
                {t('admin_metric_no_show')}
              </p>
              <p className="text-3xl sm:text-4xl font-extrabold text-red-400 mt-1 font-mono">
                {todayNoShowCount}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">Forfeited after 10m timer</p>
            </Card>

            {/* 4. Total Queue Revenue */}
            <Card hoverGlow className="text-center py-6">
              <div className="flex items-center justify-center w-11 h-11 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto mb-2">
                <IndianRupee size={22} />
              </div>
              <p className="text-xs uppercase text-gray-400 font-semibold tracking-wider">
                {t('admin_metric_revenue')}
              </p>
              <p className="text-3xl sm:text-4xl font-extrabold text-amber-300 mt-1 font-mono">
                ₹{todayTotalRevenue.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">From completed tickets</p>
            </Card>
          </div>

          {/* Queue Ledger Breakdown Table */}
          <Card title="Today's Active & Historical Queue Log" subtitle="Real-time ticket lifecycle audit">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-charcoal-700 text-gray-400 uppercase text-[10px] tracking-wider border-b border-charcoal-600">
                  <tr>
                    <th className="py-3 px-4">Token</th>
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">Services</th>
                    <th className="py-3 px-4">Assigned Barber</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-700">
                  {queue.map((token) => (
                    <tr key={token.id} className="hover:bg-charcoal-800/50">
                      <td className="py-3 px-4 font-mono font-bold text-gold">#{token.id}</td>
                      <td className="py-3 px-4 font-bold text-gray-100">{token.customerName}</td>
                      <td className="py-3 px-4 text-gray-300">
                        {token.services.map((s) => (language === 'gu' ? s.nameGu : s.nameEn)).join(' + ')}
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {token.assignedBarberName || (token.barberPreference === 'ANY' ? 'Any Available' : token.barberPreference)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            token.status === 'COMPLETED'
                              ? 'in_service'
                              : token.status === 'IN_SERVICE'
                              ? 'in_service'
                              : token.status === 'NO_SHOW' || token.status === 'CANCELLED'
                              ? 'waiting'
                              : 'gold'
                          }
                          size="sm"
                        >
                          {token.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-400 font-bold">
                        ₹{token.services.reduce((acc, s) => acc + s.priceInr, 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 5: DATABASE CONNECTIVITY & CLOUD SYNC            */}
      {/* ==================================================== */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                <Database size={18} className="text-gold" />
                <span>Supabase Cloud Database Status</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Verify live cloud persistence, table accessibility, and real-time WebSocket synchronization
              </p>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleCheckDb}
              disabled={isCheckingDb}
              className="gap-2"
            >
              {isCheckingDb ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              <span>{isCheckingDb ? 'Checking...' : 'Ping Database'}</span>
            </Button>
          </div>

          {/* Status Card */}
          <Card>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-charcoal-700">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                    dbStatus?.isConnected
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400'
                      : dbStatus?.isConfigured
                      ? 'bg-amber-950/80 border-amber-500 text-amber-400'
                      : 'bg-charcoal-700 border-charcoal-600 text-gray-400'
                  }`}
                >
                  <Database size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-100">
                      {dbStatus?.isConnected
                        ? 'Connected to Supabase Cloud'
                        : dbStatus?.isConfigured
                        ? 'Supabase Configured — Table Setup Needed'
                        : 'Running in Local Storage Mode'}
                    </h3>
                    <Badge
                      variant={dbStatus?.isConnected ? 'in_service' : dbStatus?.isConfigured ? 'waiting' : 'default'}
                      size="sm"
                      pulse={dbStatus?.isConnected}
                    >
                      {dbStatus?.isConnected ? 'LIVE' : dbStatus?.isConfigured ? 'ACTION REQUIRED' : 'LOCAL'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 font-mono">
                    Endpoint: {dbStatus?.url || 'https://placeholder.supabase.co'}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs text-gray-400">Sync Mechanism</p>
                <p className="text-sm font-bold text-gold">Postgres Realtime (WebSocket)</p>
              </div>
            </div>

            {/* If Permission Denied / Error Detected */}
            {dbStatus?.isConfigured && !dbStatus.isConnected && (
              <div className="mt-4 p-4 rounded-xl bg-amber-950/40 border border-amber-600/50 space-y-3">
                <div className="flex items-start gap-2.5 text-amber-300">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-200">Table Access Permission Denied</h4>
                    <p className="text-xs text-amber-300/90 mt-1">
                      PostgreSQL blocked access with message: <code className="bg-charcoal-900 px-1 py-0.5 rounded text-amber-200">{dbStatus.error}</code>.
                    </p>
                    <p className="text-xs text-gray-300 mt-2">
                      To fix this immediately, open your <strong>Supabase SQL Editor</strong> and run this query to grant access to the <code className="text-gold">anon</code> role:
                    </p>
                  </div>
                </div>

                <div className="relative bg-charcoal-900 rounded-lg p-3 border border-charcoal-700">
                  <pre className="text-xs text-emerald-400 font-mono overflow-x-auto whitespace-pre">
{`GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;`}
                  </pre>
                </div>
              </div>
            )}

            {/* If Connected Successfully */}
            {dbStatus?.isConnected && (
              <div className="mt-4 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-600/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>
                  All queries to <strong>queue_entries</strong>, <strong>salon_services</strong>, and <strong>barber_stations</strong> are executing successfully with sub-second synchronization.
                </span>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ==================================================== */}
      {/* SERVICE ADD / EDIT MODAL                             */}
      {/* ==================================================== */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-charcoal-800 rounded-3xl border border-charcoal-600 max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-charcoal-600">
              <h3 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                <Scissors size={18} className="text-gold" />
                <span>{editingServiceId ? t('admin_edit_service') : t('admin_add_service')}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsServiceModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-300 mb-1">
                  {t('admin_service_name_en')} *
                </label>
                <input
                  type="text"
                  value={serviceForm.nameEn}
                  onChange={(e) => setServiceForm({ ...serviceForm, nameEn: e.target.value })}
                  placeholder="e.g. Signature Beard Styling"
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-xl px-3 py-2 text-gray-100 focus:outline-none focus:border-gold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">
                  {t('admin_service_name_gu')} (Gujarati)
                </label>
                <input
                  type="text"
                  value={serviceForm.nameGu}
                  onChange={(e) => setServiceForm({ ...serviceForm, nameGu: e.target.value })}
                  placeholder="દા.ત. સિગ્નેચર દાઢી સ્ટાઇલિંગ"
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-xl px-3 py-2 text-gray-100 focus:outline-none focus:border-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-300 mb-1">
                    {t('admin_service_duration')} *
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    step="1"
                    value={serviceForm.durationMinutes}
                    onChange={(e) => setServiceForm({ ...serviceForm, durationMinutes: Number(e.target.value) })}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-xl px-3 py-2 text-gray-100 font-mono focus:outline-none focus:border-gold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-300 mb-1">
                    {t('admin_service_price')} *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={serviceForm.priceInr}
                    onChange={(e) => setServiceForm({ ...serviceForm, priceInr: Number(e.target.value) })}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-xl px-3 py-2 text-gray-100 font-mono focus:outline-none focus:border-gold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">
                  {t('admin_service_category')}
                </label>
                <select
                  value={serviceForm.category}
                  onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value as 'hair' | 'beard' | 'spa' | 'skin' })}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-xl px-3 py-2 text-gray-100 focus:outline-none focus:border-gold"
                >
                  <option value="hair">Hair (હેર)</option>
                  <option value="beard">Beard & Shave (દાઢી અને શેવ)</option>
                  <option value="skin">Skin & Facial (ત્વચા અને ફેસ સ્ક્રબ)</option>
                  <option value="spa">Spa & Massage (સ્પા અને મસાજ)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="serviceActiveCheck"
                  checked={serviceForm.isActive}
                  onChange={(e) => setServiceForm({ ...serviceForm, isActive: e.target.checked })}
                  className="w-4 h-4 accent-gold rounded"
                />
                <label htmlFor="serviceActiveCheck" className="text-gray-200 font-bold select-none cursor-pointer">
                  {t('admin_service_active')}
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-charcoal-600">
                <Button
                  type="button"
                  variant="slate"
                  size="sm"
                  onClick={() => setIsServiceModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" className="gap-1.5">
                  <Check size={14} />
                  <span>{t('admin_save_service')}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* BARBER ADD / EDIT MODAL                              */}
      {/* ==================================================== */}
      {isBarberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-charcoal-800 rounded-3xl border border-charcoal-600 max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-charcoal-600">
              <h3 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                <Users size={18} className="text-gold" />
                <span>{editingBarberId ? 'Edit Stylist' : 'Add New Stylist'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsBarberModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBarber} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-300 mb-1">Stylist Name *</label>
                <input
                  type="text"
                  value={barberForm.name}
                  onChange={(e) => setBarberForm({ ...barberForm, name: e.target.value })}
                  placeholder="e.g. Chetan Solanki"
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-xl px-3 py-2 text-gray-100 focus:outline-none focus:border-gold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-300 mb-1">Chair Number *</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={barberForm.chairNumber}
                    onChange={(e) => setBarberForm({ ...barberForm, chairNumber: Number(e.target.value) })}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-xl px-3 py-2 text-gray-100 font-mono focus:outline-none focus:border-gold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-300 mb-1">Avatar Emoji</label>
                  <input
                    type="text"
                    value={barberForm.avatar}
                    onChange={(e) => setBarberForm({ ...barberForm, avatar: e.target.value })}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-xl px-3 py-2 text-gray-100 text-center text-lg focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-300 mb-1">Shift Start</label>
                  <input
                    type="time"
                    value={barberForm.shiftStart}
                    onChange={(e) => setBarberForm({ ...barberForm, shiftStart: e.target.value })}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-xl px-3 py-2 text-gray-100 font-mono focus:outline-none focus:border-gold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-300 mb-1">Shift End</label>
                  <input
                    type="time"
                    value={barberForm.shiftEnd}
                    onChange={(e) => setBarberForm({ ...barberForm, shiftEnd: e.target.value })}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-xl px-3 py-2 text-gray-100 font-mono focus:outline-none focus:border-gold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">Specialties (English)</label>
                <input
                  type="text"
                  value={barberForm.specialtiesEn}
                  onChange={(e) => setBarberForm({ ...barberForm, specialtiesEn: e.target.value })}
                  placeholder="e.g. Skin Fade, Beard Sculpting"
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-xl px-3 py-2 text-gray-100 focus:outline-none focus:border-gold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-charcoal-600">
                <Button
                  type="button"
                  variant="slate"
                  size="sm"
                  onClick={() => setIsBarberModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" className="gap-1.5">
                  <Check size={14} />
                  <span>Save Stylist</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
