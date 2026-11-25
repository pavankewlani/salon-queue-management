import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { QueueToken, ServiceItem, BarberStation, SalonConfiguration, BarberPreference, TokenStatus } from '../types';
import { initialServices, initialBarbers, initialQueue, defaultSalonConfig } from '../data/mockData';
import {
  isSupabaseConfigured,
  checkSupabaseConnection,
  saveQueueEntryToSupabase,
  updateQueueEntryInSupabase,
  saveServiceToSupabase,
  updateServiceInSupabase,
  updateBarberInSupabase,
  updateSalonConfigInSupabase,
  fetchQueueFromSupabase,
  fetchServicesFromSupabase,
  fetchBarbersFromSupabase,
  fetchSalonConfigFromSupabase,
  subscribeToSupabaseRealtime,
} from '../lib/supabase';

export interface TokenPositionInfo {
  position: number;
  aheadCount: number;
  status: TokenStatus;
  isUpNext: boolean;
  isSecondInLine: boolean;
  isCalled: boolean;
  isInService: boolean;
  isTerminal: boolean;
  canCancel: boolean;
  estimatedWaitMinutes: number;
}

interface QueueContextType {
  services: ServiceItem[];
  barbers: BarberStation[];
  queue: QueueToken[];
  salonConfig: SalonConfiguration;
  activeWaitingCount: number;
  estimatedGeneralWaitMins: number;
  isOnlineQueueOpen: boolean;
  currentTime: Date;
  toggleSimulatedQueueHours: () => void;
  addTokenToQueue: (data: {
    customerName: string;
    customerPhone: string;
    services: ServiceItem[];
    barberPreference: BarberPreference;
  }) => Promise<{ success: boolean; token?: QueueToken; error?: string }>;
  addWalkIn: (data: {
    customerName: string;
    customerPhone: string;
    services: ServiceItem[];
    barberPreference: BarberPreference;
  }) => Promise<{ success: boolean; token?: QueueToken; error?: string }>;
  callNextForBarber: (barberId: string) => { success: boolean; token?: QueueToken; error?: string };
  seatCustomer: (tokenId: string, barberId?: string) => { success: boolean; error?: string };
  completeService: (tokenId: string, barberId: string) => { success: boolean; error?: string };
  markNoShow: (tokenId: string) => { success: boolean; error?: string };
  cancelToken: (tokenId: string) => { success: boolean; error?: string };
  toggleBarberBreak: (barberId: string) => { success: boolean; error?: string };
  isPhoneActiveInQueue: (phone: string) => { isActive: boolean; activeToken?: QueueToken };
  findTokenByQuery: (query: string) => QueueToken | undefined;
  getBarberWaitMins: (barberId: string) => number;
  getTokenPosition: (tokenId: string) => TokenPositionInfo;
  // Screen 7 Admin / Owner Settings
  addService: (data: Omit<ServiceItem, 'id'>) => Promise<boolean>;
  updateService: (id: string, updates: Partial<ServiceItem>) => Promise<boolean>;
  toggleServiceStatus: (id: string) => Promise<boolean>;
  deleteService: (id: string) => Promise<boolean>;
  updateBarber: (id: string, updates: Partial<BarberStation>) => Promise<boolean>;
  setBarberOnDuty: (id: string) => Promise<boolean>;
  setBarberOnBreak: (id: string) => Promise<boolean>;
  addBarber: (data: Omit<BarberStation, 'id'>) => Promise<boolean>;
  updateSalonConfig: (updates: Partial<SalonConfiguration>) => Promise<boolean>;
  setOnlineQueueForceStatus: (forceOpen: boolean | null) => void;
  todayServedCount: number;
  todayNoShowCount: number;
  todayAvgWaitMins: number;
  todayTotalRevenue: number;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

const STORAGE_KEY_QUEUE = 'salon_queue_tokens';
const STORAGE_KEY_BARBERS = 'salon_barber_stations';
const STORAGE_KEY_SERVICES = 'salon_services';
const STORAGE_KEY_CONFIG = 'salon_config';
const STORAGE_KEY_FORCE_OPEN = 'salon_force_online_open';

interface QueueProviderProps {
  children: React.ReactNode;
  initialConfig?: Partial<SalonConfiguration>;
  overrideOnlineOpen?: boolean;
}

export const QueueProvider: React.FC<QueueProviderProps> = ({
  children,
  initialConfig,
  overrideOnlineOpen,
}) => {
  const [services, setServices] = useState<ServiceItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SERVICES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error reading services from localStorage', e);
    }
    return initialServices;
  });

  const [salonConfig, setSalonConfig] = useState<SalonConfiguration>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) return { ...defaultSalonConfig, ...initialConfig, ...JSON.parse(saved) };
    } catch (e) {
      console.error('Error reading salonConfig from localStorage', e);
    }
    return {
      ...defaultSalonConfig,
      ...initialConfig,
    };
  });

  const [, setSimulatedForceOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_FORCE_OPEN);
    return saved !== null ? saved === 'true' : true;
  });

  // Barbers state
  const [barbers, setBarbers] = useState<BarberStation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BARBERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error reading barbers from localStorage', e);
    }
    return initialBarbers;
  });

  // Queue tokens state
  const [queue, setQueue] = useState<QueueToken[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_QUEUE);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error reading queue from localStorage', e);
    }
    return initialQueue;
  });

  const queueRef = useRef<QueueToken[]>(queue);
  queueRef.current = queue;

  const barbersRef = useRef<BarberStation[]>(barbers);
  barbersRef.current = barbers;

  // Persist queue, barbers, services, config to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(queue));
    } catch (e) {
      console.error('Error writing queue to localStorage', e);
    }
  }, [queue]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BARBERS, JSON.stringify(barbers));
    } catch (e) {
      console.error('Error writing barbers to localStorage', e);
    }
  }, [barbers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(services));
    } catch (e) {
      console.error('Error writing services to localStorage', e);
    }
  }, [services]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(salonConfig));
    } catch (e) {
      console.error('Error writing salonConfig to localStorage', e);
    }
  }, [salonConfig]);

  // Multi-window cross-tab synchronization (< 50ms)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_QUEUE && e.newValue) {
        try {
          setQueue(JSON.parse(e.newValue));
        } catch (err) {
          console.error('Error syncing queue across windows', err);
        }
      }
      if (e.key === STORAGE_KEY_BARBERS && e.newValue) {
        try {
          setBarbers(JSON.parse(e.newValue));
        } catch (err) {
          console.error('Error syncing barbers across windows', err);
        }
      }
      if (e.key === STORAGE_KEY_SERVICES && e.newValue) {
        try {
          setServices(JSON.parse(e.newValue));
        } catch (err) {
          console.error('Error syncing services across windows', err);
        }
      }
      if (e.key === STORAGE_KEY_CONFIG && e.newValue) {
        try {
          setSalonConfig(JSON.parse(e.newValue));
        } catch (err) {
          console.error('Error syncing config across windows', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Real-time Cloud Synchronization with Supabase
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let isMounted = true;

    // Check connection and report in console
    checkSupabaseConnection().then((res) => {
      if (!isMounted) return;
      if (res.isConnected) {
        console.log(`%c[Supabase] ✅ Cloud Database Connected: ${res.url}`, 'color: #10B981; font-weight: bold;');
      } else if (res.isConfigured) {
        console.warn(`[Supabase] ⚠️ Configured (${res.url}), but query returned: ${res.error}`);
      }
    });

    // Initial fetch from Supabase
    const loadFromSupabase = async () => {
      try {
        const [remoteQueue, remoteServices, remoteBarbers, remoteConfig] = await Promise.all([
          fetchQueueFromSupabase(),
          fetchServicesFromSupabase(),
          fetchBarbersFromSupabase(),
          fetchSalonConfigFromSupabase(),
        ]);
        if (!isMounted) return;
        if (remoteQueue && remoteQueue.length > 0) setQueue(remoteQueue);
        if (remoteServices && remoteServices.length > 0) setServices(remoteServices);
        if (remoteBarbers && remoteBarbers.length > 0) setBarbers(remoteBarbers);
        if (remoteConfig) setSalonConfig((prev) => ({ ...prev, ...remoteConfig }));
      } catch (err) {
        console.warn('Initial Supabase load note:', err);
      }
    };

    loadFromSupabase();

    // Subscribe to live database updates across all terminals
    const unsubscribe = subscribeToSupabaseRealtime({
      onQueueChange: async () => {
        const fresh = await fetchQueueFromSupabase();
        if (isMounted && fresh) setQueue(fresh);
      },
      onBarbersChange: async () => {
        const fresh = await fetchBarbersFromSupabase();
        if (isMounted && fresh) setBarbers(fresh);
      },
      onServicesChange: async () => {
        const fresh = await fetchServicesFromSupabase();
        if (isMounted && fresh) setServices(fresh);
      },
      onConfigChange: async () => {
        const fresh = await fetchSalonConfigFromSupabase();
        if (isMounted && fresh) setSalonConfig((prev) => ({ ...prev, ...fresh }));
      },
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Live clock ticker for real-time queue cutoff and countdowns
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-finish service when service duration has elapsed (does not wait for button press)
  useEffect(() => {
    const checkServiceDurations = () => {
      const currentQueue = queueRef.current || queue;
      const currentBarbers = barbersRef.current || barbers;
      const now = Date.now();

      const inServiceTokens = currentQueue.filter(
        (t) => t.status === 'IN_SERVICE' && t.serviceStartedAt
      );

      if (inServiceTokens.length === 0) return;

      let hasUpdates = false;
      let nextQueue = [...currentQueue];
      let nextBarbers = [...currentBarbers];

      for (const token of inServiceTokens) {
        const startTime = new Date(token.serviceStartedAt!).getTime();
        const totalDurationMins =
          token.services?.reduce((acc, s) => acc + (s.durationMinutes || 0), 0) || 15;
        const totalDurationMs = totalDurationMins * 60 * 1000;

        // If elapsed time has reached or exceeded scheduled duration, auto-finish service!
        if (now - startTime >= totalDurationMs) {
          hasUpdates = true;
          const nowIso = new Date().toISOString();

          nextQueue = nextQueue.map((t) =>
            t.id === token.id
              ? {
                  ...t,
                  status: 'COMPLETED' as TokenStatus,
                  serviceCompletedAt: nowIso,
                }
              : t
          );

          const targetBarberId = token.assignedBarberId;
          if (targetBarberId) {
            nextBarbers = nextBarbers.map((b) =>
              b.id === targetBarberId
                ? {
                    ...b,
                    status: 'IDLE' as const,
                    currentCustomerTokenId: undefined,
                    currentCustomerName: undefined,
                  }
                : b
            );
          }

          // Persist auto-completion to Supabase
          updateQueueEntryInSupabase(token.id, {
            status: 'COMPLETED',
            serviceCompletedAt: nowIso,
          });
          if (targetBarberId) {
            updateBarberInSupabase(targetBarberId, {
              status: 'IDLE',
              currentCustomerTokenId: undefined,
              currentCustomerName: undefined,
            });
          }
        }
      }

      if (hasUpdates) {
        queueRef.current = nextQueue;
        setQueue(nextQueue);
        barbersRef.current = nextBarbers;
        setBarbers(nextBarbers);
      }
    };

    const timer = setInterval(checkServiceDurations, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleSimulatedQueueHours = () => {
    const nextVal = !isOnlineQueueOpen;
    setOnlineQueueForceStatus(nextVal);
  };

  // Active non-terminal statuses: WAITING, UP_NEXT, CALLED
  const activeTokens = queue.filter(
    (t) => t.status === 'WAITING' || t.status === 'UP_NEXT' || t.status === 'CALLED'
  );
  const activeWaitingCount = activeTokens.length;

  // Calculate dynamic wait time for "Any Available"
  const idleBarbers = barbers.filter((b) => b.status === 'IDLE');
  const estimatedGeneralWaitMins = idleBarbers.length > 0 ? 5 : Math.max(10, activeWaitingCount * 12);

  // Check 30-minute online cutoff and operating hours (auto-closes based on real-time clock)
  const checkOnlineQueueOpen = (): boolean => {
    if (salonConfig.isEmergencyPaused) return false;
    // Explicit owner manual override in Admin Settings takes precedence
    if (salonConfig.forceOnlineQueueOpen !== undefined && salonConfig.forceOnlineQueueOpen !== null) {
      return salonConfig.forceOnlineQueueOpen;
    }
    if (overrideOnlineOpen !== undefined) return overrideOnlineOpen;

    // Automatic schedule based on real-time clock
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const [openHour, openMin] = (salonConfig.openingTime || '09:00').split(':').map(Number);
    const [closeHour, closeMin] = (salonConfig.closingTime || '21:00').split(':').map(Number);

    const openMinutes = openHour * 60 + openMin;
    const cutoffMinutes = closeHour * 60 + closeMin - (salonConfig.onlineCutoffMinutesBeforeClosing ?? 30);

    return currentMinutes >= openMinutes && currentMinutes < cutoffMinutes;
  };

  const isOnlineQueueOpen = useMemo(() => {
    return checkOnlineQueueOpen();
  }, [salonConfig, overrideOnlineOpen, currentTime]);

  // Invariant 04: One active position per phone number
  const isPhoneActiveInQueue = (phone: string): { isActive: boolean; activeToken?: QueueToken } => {
    const cleanPhone = phone.trim().replace(/\D/g, '');
    const currentQueue = queueRef.current || queue;
    const found = currentQueue.find(
      (t) =>
        t.customerPhone.replace(/\D/g, '') === cleanPhone &&
        ['WAITING', 'UP_NEXT', 'CALLED', 'IN_SERVICE'].includes(t.status)
    );
    return { isActive: Boolean(found), activeToken: found };
  };

  // Find token by exact phone or ID
  const findTokenByQuery = (query: string): QueueToken | undefined => {
    const clean = query.trim().toUpperCase().replace('#', '');
    const cleanDigits = query.trim().replace(/\D/g, '');
    return queue.find(
      (t) =>
        t.id.toUpperCase() === clean ||
        (cleanDigits.length === 10 && t.customerPhone.replace(/\D/g, '') === cleanDigits)
    );
  };

  // Dynamic wait time per barber
  const getBarberWaitMins = (barberId: string): number => {
    if (barberId === 'ANY') return estimatedGeneralWaitMins;
    const barber = barbers.find((b) => b.id === barberId);
    if (!barber) return estimatedGeneralWaitMins;
    if (barber.status === 'IDLE') return 0;
    if (barber.status === 'ON_BREAK') return 20;

    const barberQueue = queue.filter(
      (t) =>
        (t.assignedBarberId === barberId || t.barberPreference === barberId) &&
        ['WAITING', 'UP_NEXT', 'CALLED', 'IN_SERVICE'].includes(t.status)
    );
    const totalMins = barberQueue.reduce((acc, t) => {
      const dur = t.services.reduce((sAcc, s) => sAcc + s.durationMinutes, 0);
      return acc + dur;
    }, 0);

    return Math.max(15, totalMins || barber.currentWaitMins || 25);
  };

  // Token position calculation (for Screen 3 & live updates)
  const getTokenPosition = (tokenId: string): TokenPositionInfo => {
    const token = queue.find((t) => t.id === tokenId);
    if (!token) {
      return {
        position: 0,
        aheadCount: 0,
        status: 'CANCELLED',
        isUpNext: false,
        isSecondInLine: false,
        isCalled: false,
        isInService: false,
        isTerminal: true,
        canCancel: false,
        estimatedWaitMinutes: 0,
      };
    }

    const isTerminal = ['COMPLETED', 'NO_SHOW', 'CANCELLED'].includes(token.status);
    const isInService = token.status === 'IN_SERVICE';
    const isCalled = token.status === 'CALLED';

    // Invariant: Cannot cancel if actively in service or terminal
    const canCancel = !isInService && !isTerminal;

    if (isInService) {
      return {
        position: 0,
        aheadCount: 0,
        status: token.status,
        isUpNext: false,
        isSecondInLine: false,
        isCalled: false,
        isInService: true,
        isTerminal: false,
        canCancel: false,
        estimatedWaitMinutes: 0,
      };
    }

    if (isCalled) {
      return {
        position: 0,
        aheadCount: 0,
        status: token.status,
        isUpNext: false,
        isSecondInLine: false,
        isCalled: true,
        isInService: false,
        isTerminal: false,
        canCancel: true,
        estimatedWaitMinutes: 0,
      };
    }

    if (isTerminal) {
      return {
        position: 0,
        aheadCount: 0,
        status: token.status,
        isUpNext: false,
        isSecondInLine: false,
        isCalled: false,
        isInService: false,
        isTerminal: true,
        canCancel: false,
        estimatedWaitMinutes: 0,
      };
    }

    // Rank among all waiting tokens sorted chronologically (FCFS)
    const waitingTokens = queue
      .filter((t) => t.status === 'WAITING' || t.status === 'UP_NEXT')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const index = waitingTokens.findIndex((t) => t.id === tokenId);
    const position = index >= 0 ? index + 1 : 1;
    const aheadCount = Math.max(0, position - 1);

    const isUpNext = position === 1;
    const isSecondInLine = position === 2;

    const estWait = position === 1 ? 5 : position * 10;

    return {
      position,
      aheadCount,
      status: token.status,
      isUpNext,
      isSecondInLine,
      isCalled: false,
      isInService: false,
      isTerminal: false,
      canCancel,
      estimatedWaitMinutes: estWait,
    };
  };

  // Helper to generate unique sequential token (S-1, S-2, etc.)
  const generateNextTokenId = (): string => {
    const existingNums = queue
      .map((t) => {
        const match = t.id.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const nextNum = (Math.max(0, ...existingNums) || 4) + 1;
    return `S-${nextNum}`;
  };

  // Online Queue Join (Customer self-service)
  const addTokenToQueue = async (data: {
    customerName: string;
    customerPhone: string;
    services: ServiceItem[];
    barberPreference: BarberPreference;
  }): Promise<{ success: boolean; token?: QueueToken; error?: string }> => {
    // Name validation
    if (!data.customerName || data.customerName.trim().length < 2) {
      return { success: false, error: 'Please enter a valid name (at least 2 characters).' };
    }

    // Phone validation (10-digit Indian mobile starting with 6,7,8,9)
    const cleanPhone = data.customerPhone.trim().replace(/\D/g, '');
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      return { success: false, error: 'Please enter a valid 10-digit Indian mobile number.' };
    }

    // Invariant 03: Max 3 services
    if (!data.services.length || data.services.length > 3) {
      return { success: false, error: 'Maximum 3 services allowed per booking.' };
    }

    // Invariant 04: Duplicate phone check
    const phoneCheck = isPhoneActiveInQueue(data.customerPhone);
    if (phoneCheck.isActive && phoneCheck.activeToken) {
      return {
        success: false,
        error: `This phone already has an active queue ticket (#${phoneCheck.activeToken.id}).`,
      };
    }

    // Invariant 08: Online Cutoff
    if (!isOnlineQueueOpen) {
      return {
        success: false,
        error: 'Online queue is closed 30 minutes before salon closing.',
      };
    }

    const newTokenId = generateNextTokenId();
    const estWait = getBarberWaitMins(data.barberPreference);

    const assignedBarber =
      data.barberPreference !== 'ANY'
        ? barbers.find((b) => b.id === data.barberPreference)
        : undefined;

    const newToken: QueueToken = {
      id: newTokenId,
      customerName: data.customerName.trim(),
      customerPhone: cleanPhone,
      services: data.services,
      barberPreference: data.barberPreference,
      assignedBarberId: assignedBarber?.id,
      assignedBarberName: assignedBarber?.name,
      chairNumber: assignedBarber?.chairNumber,
      status: 'WAITING',
      isWalkIn: false,
      createdAt: new Date().toISOString(),
      estimatedWaitMinutes: estWait,
    };

    const nextQueue = [...(queueRef.current || queue), newToken];
    queueRef.current = nextQueue;
    setQueue(nextQueue);
    // Save to Supabase
    saveQueueEntryToSupabase(newToken);

    return { success: true, token: newToken };
  };

  // Invariant 09: Reception Walk-In Registration (Can bypass online 30-min cutoff)
  const addWalkIn = async (data: {
    customerName: string;
    customerPhone: string;
    services: ServiceItem[];
    barberPreference: BarberPreference;
  }): Promise<{ success: boolean; token?: QueueToken; error?: string }> => {
    // Name validation
    if (!data.customerName || data.customerName.trim().length < 2) {
      return { success: false, error: 'Please enter a valid name (at least 2 characters).' };
    }

    // Phone validation (10-digit Indian mobile)
    const cleanPhone = data.customerPhone.trim().replace(/\D/g, '');
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      return { success: false, error: 'Please enter a valid 10-digit Indian mobile number.' };
    }

    // Invariant 03: Max 3 services
    if (!data.services.length || data.services.length > 3) {
      return { success: false, error: 'Maximum 3 services allowed per booking.' };
    }

    // Invariant 04: Duplicate phone check
    const phoneCheck = isPhoneActiveInQueue(data.customerPhone);
    if (phoneCheck.isActive && phoneCheck.activeToken) {
      return {
        success: false,
        error: `Customer already has an active ticket (#${phoneCheck.activeToken.id}).`,
      };
    }

    const newTokenId = generateNextTokenId();
    const estWait = getBarberWaitMins(data.barberPreference);

    const assignedBarber =
      data.barberPreference !== 'ANY'
        ? barbers.find((b) => b.id === data.barberPreference)
        : undefined;

    const newToken: QueueToken = {
      id: newTokenId,
      customerName: data.customerName.trim(),
      customerPhone: cleanPhone,
      services: data.services,
      barberPreference: data.barberPreference,
      assignedBarberId: assignedBarber?.id,
      assignedBarberName: assignedBarber?.name,
      chairNumber: assignedBarber?.chairNumber,
      status: 'WAITING',
      isWalkIn: true,
      createdAt: new Date().toISOString(),
      estimatedWaitMinutes: estWait,
    };

    const nextWalkInQueue = [...(queueRef.current || queue), newToken];
    queueRef.current = nextWalkInQueue;
    setQueue(nextWalkInQueue);
    saveQueueEntryToSupabase(newToken);

    return { success: true, token: newToken };
  };

  // Screen 4 Core Action: Call Next Customer for a Specific Barber (Strict FCFS)
  const callNextForBarber = (barberId: string): { success: boolean; token?: QueueToken; error?: string } => {
    const barber = barbers.find((b) => b.id === barberId);
    if (!barber) {
      return { success: false, error: 'Barber station not found.' };
    }

    // Mutex rule: Barber cannot be busy or already calling
    if (barber.status === 'IN_SERVICE') {
      return { success: false, error: 'This barber chair is currently busy serving another customer.' };
    }
    if (barber.status === 'CALLING') {
      return { success: false, error: 'Barber is already calling a customer. Seat or mark no-show first.' };
    }

    // Break rule: Barber cannot take clients while on break or offline
    if (barber.status === 'ON_BREAK') {
      return { success: false, error: 'This barber is currently on break.' };
    }
    if (barber.status === 'OFFLINE') {
      return { success: false, error: 'This barber is currently offline.' };
    }

    // FCFS Selection Rule:
    // 1. Filter tokens in WAITING or UP_NEXT
    // 2. Sort chronologically by createdAt ascending
    // 3. Select the earliest token matching barberPreference: 'ANY' OR this barber's ID
    // 4. Skip customers assigned or preferred to other specific barbers
    const eligibleWaiting = (queueRef.current || queue)
      .filter((t) => (t.status === 'WAITING' || t.status === 'UP_NEXT'))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const nextToken = eligibleWaiting.find(
      (t) => t.barberPreference === 'ANY' || t.barberPreference === barberId
    );

    if (!nextToken) {
      return { success: false, error: 'No eligible waiting customer found for this barber.' };
    }

    const nowIso = new Date().toISOString();

    // Mutate token state
    const updatedToken: QueueToken = {
      ...nextToken,
      status: 'CALLED',
      assignedBarberId: barber.id,
      assignedBarberName: barber.name,
      chairNumber: barber.chairNumber,
      calledAt: nowIso,
    };

    // Mutate barber state
    const updatedBarber: BarberStation = {
      ...barber,
      status: 'CALLING',
      currentCustomerTokenId: nextToken.id,
      currentCustomerName: nextToken.customerName,
    };

    const nextQueue = (queueRef.current || queue).map((t) => (t.id === nextToken.id ? updatedToken : t));
    queueRef.current = nextQueue;
    setQueue(nextQueue);

    const nextBarbers = (barbersRef.current || barbers).map((b) => (b.id === barberId ? updatedBarber : b));
    barbersRef.current = nextBarbers;
    setBarbers(nextBarbers);

    updateQueueEntryInSupabase(nextToken.id, {
      status: 'CALLED',
      assignedBarberId: barber.id,
      chairNumber: barber.chairNumber,
      calledAt: nowIso,
    });

    return { success: true, token: updatedToken };
  };

  // Seat customer in chair (starts service)
  const seatCustomer = (tokenId: string, barberId?: string): { success: boolean; error?: string } => {
    const currentQueue = queueRef.current || queue;
    const currentBarbers = barbersRef.current || barbers;
    const token = currentQueue.find((t) => t.id === tokenId);
    if (!token) return { success: false, error: 'Token not found.' };

    // Prevent invalid transition: terminal states cannot be seated
    if (['COMPLETED', 'NO_SHOW', 'CANCELLED'].includes(token.status)) {
      return { success: false, error: 'Cannot seat a customer whose token is in a terminal state.' };
    }

    const targetBarberId = barberId || token.assignedBarberId;
    const barber = currentBarbers.find((b) => b.id === targetBarberId);

    if (barber && barber.status === 'IN_SERVICE' && barber.currentCustomerTokenId !== tokenId) {
      return { success: false, error: 'Barber chair is already occupied by another customer.' };
    }

    const nowIso = new Date().toISOString();

    const nextQueue = currentQueue.map((t) =>
      t.id === tokenId
        ? {
            ...t,
            status: 'IN_SERVICE' as TokenStatus,
            serviceStartedAt: nowIso,
            assignedBarberId: targetBarberId,
            assignedBarberName: barber?.name,
            chairNumber: barber?.chairNumber,
          }
        : t
    );
    queueRef.current = nextQueue;
    setQueue(nextQueue);

    if (barber) {
      const nextBarbers = currentBarbers.map((b) =>
        b.id === barber.id
          ? {
              ...b,
              status: 'IN_SERVICE' as const,
              currentCustomerTokenId: tokenId,
              currentCustomerName: token.customerName,
            }
          : b
      );
      barbersRef.current = nextBarbers;
      setBarbers(nextBarbers);
    }

    updateQueueEntryInSupabase(tokenId, {
      status: 'IN_SERVICE',
      serviceStartedAt: nowIso,
      assignedBarberId: targetBarberId,
    });

    return { success: true };
  };

  // Complete service and free chair
  const completeService = (tokenId: string, barberId: string): { success: boolean; error?: string } => {
    const currentQueue = queueRef.current || queue;
    const currentBarbers = barbersRef.current || barbers;
    const token = currentQueue.find((t) => t.id === tokenId);
    if (!token) return { success: false, error: 'Token not found.' };

    if (token.status !== 'IN_SERVICE') {
      return { success: false, error: 'Cannot complete service for a token that is not in service.' };
    }

    const nowIso = new Date().toISOString();

    const nextQueue = currentQueue.map((t) =>
      t.id === tokenId
        ? { ...t, status: 'COMPLETED' as TokenStatus, serviceCompletedAt: nowIso }
        : t
    );
    queueRef.current = nextQueue;
    setQueue(nextQueue);

    const nextBarbers = currentBarbers.map((b) =>
      b.id === barberId
        ? {
            ...b,
            status: 'IDLE' as const,
            currentCustomerTokenId: undefined,
            currentCustomerName: undefined,
          }
        : b
    );
    barbersRef.current = nextBarbers;
    setBarbers(nextBarbers);

    updateQueueEntryInSupabase(tokenId, {
      status: 'COMPLETED',
      serviceCompletedAt: nowIso,
    });

    return { success: true };
  };

  // Mark No-Show (Invariant 06: grace window expired)
  const markNoShow = (tokenId: string): { success: boolean; error?: string } => {
    const currentQueue = queueRef.current || queue;
    const currentBarbers = barbersRef.current || barbers;
    const token = currentQueue.find((t) => t.id === tokenId);
    if (!token) return { success: false, error: 'Token not found.' };

    if (['COMPLETED', 'NO_SHOW', 'CANCELLED'].includes(token.status)) {
      return { success: false, error: 'Token is already in a terminal state.' };
    }

    const nextQueue = currentQueue.map((t) =>
      t.id === tokenId ? { ...t, status: 'NO_SHOW' as TokenStatus } : t
    );
    queueRef.current = nextQueue;
    setQueue(nextQueue);

    // If barber was waiting on this token, free the chair
    if (token.assignedBarberId) {
      const nextBarbers = currentBarbers.map((b) =>
        b.id === token.assignedBarberId && (b.status === 'CALLING' || b.status === 'IN_SERVICE')
          ? {
              ...b,
              status: 'IDLE' as const,
              currentCustomerTokenId: undefined,
              currentCustomerName: undefined,
            }
          : b
      );
      barbersRef.current = nextBarbers;
      setBarbers(nextBarbers);
    }

    updateQueueEntryInSupabase(tokenId, { status: 'NO_SHOW' });
    return { success: true };
  };

  // Cancel Spot (with Invariant 07 & In-service restriction)
  const cancelToken = (tokenId: string): { success: boolean; error?: string } => {
    const currentQueue = queueRef.current || queue;
    const currentBarbers = barbersRef.current || barbers;
    const token = currentQueue.find((t) => t.id === tokenId);
    if (!token) return { success: false, error: 'Token not found.' };

    // In-service restriction
    if (token.status === 'IN_SERVICE') {
      return { success: false, error: 'Cancellation is not permitted while service is actively in progress.' };
    }

    if (['COMPLETED', 'NO_SHOW', 'CANCELLED'].includes(token.status)) {
      return { success: false, error: 'Token is already in a terminal state.' };
    }

    const nextQueue = currentQueue.map((t) =>
      t.id === tokenId ? { ...t, status: 'CANCELLED' as TokenStatus } : t
    );
    queueRef.current = nextQueue;
    setQueue(nextQueue);

    // If barber was calling this token, reset to IDLE
    if (token.assignedBarberId) {
      const nextBarbers = currentBarbers.map((b) =>
        b.id === token.assignedBarberId && b.status === 'CALLING'
          ? {
              ...b,
              status: 'IDLE' as const,
              currentCustomerTokenId: undefined,
              currentCustomerName: undefined,
            }
          : b
      );
      barbersRef.current = nextBarbers;
      setBarbers(nextBarbers);
    }

    updateQueueEntryInSupabase(tokenId, { status: 'CANCELLED' });
    return { success: true };
  };

  // Toggle barber break
  const toggleBarberBreak = (barberId: string): { success: boolean; error?: string } => {
    const barber = barbers.find((b) => b.id === barberId);
    if (!barber) return { success: false, error: 'Barber not found.' };

    if (barber.status === 'IN_SERVICE' || barber.status === 'CALLING') {
      return { success: false, error: 'Cannot toggle break while barber has an active client.' };
    }

    const nextStatus = barber.status === 'ON_BREAK' ? 'IDLE' : 'ON_BREAK';

    setBarbers((prev) =>
      prev.map((b) => (b.id === barberId ? { ...b, status: nextStatus } : b))
    );

    return { success: true };
  };

  // Screen 7 Admin / Owner Settings Implementations
  const addService = async (data: Omit<ServiceItem, 'id'>): Promise<boolean> => {
    const newService: ServiceItem = {
      ...data,
      id: `srv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setServices((prev) => [...prev, newService]);
    await saveServiceToSupabase(newService);
    return true;
  };

  const updateService = async (id: string, updates: Partial<ServiceItem>): Promise<boolean> => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    await updateServiceInSupabase(id, updates);
    return true;
  };

  const toggleServiceStatus = async (id: string): Promise<boolean> => {
    const target = services.find((s) => s.id === id);
    if (!target) return false;
    const nextActive = !target.isActive;
    return updateService(id, { isActive: nextActive });
  };

  const deleteService = async (id: string): Promise<boolean> => {
    setServices((prev) => prev.filter((s) => s.id !== id));
    return true;
  };

  const updateBarber = async (id: string, updates: Partial<BarberStation>): Promise<boolean> => {
    setBarbers((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );
    await updateBarberInSupabase(id, updates);
    return true;
  };

  const setBarberOnDuty = async (id: string): Promise<boolean> => {
    const barber = barbers.find((b) => b.id === id);
    if (!barber) return false;
    const nextStatus = barber.currentCustomerTokenId ? 'IN_SERVICE' : 'IDLE';
    return updateBarber(id, { status: nextStatus });
  };

  const setBarberOnBreak = async (id: string): Promise<boolean> => {
    const barber = barbers.find((b) => b.id === id);
    if (!barber) return false;
    if (barber.status === 'IN_SERVICE') {
      return false;
    }
    return updateBarber(id, { status: 'ON_BREAK' });
  };

  const addBarber = async (data: Omit<BarberStation, 'id'>): Promise<boolean> => {
    const newBarber: BarberStation = {
      ...data,
      id: `barber-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setBarbers((prev) => [...prev, newBarber]);
    await updateBarberInSupabase(newBarber.id, newBarber);
    return true;
  };

  const updateSalonConfig = async (updates: Partial<SalonConfiguration>): Promise<boolean> => {
    setSalonConfig((prev) => ({ ...prev, ...updates }));
    await updateSalonConfigInSupabase(updates);
    return true;
  };

  const setOnlineQueueForceStatus = (forceOpen: boolean | null) => {
    setSalonConfig((prev) => ({ ...prev, forceOnlineQueueOpen: forceOpen }));
    if (forceOpen !== null) {
      setSimulatedForceOpen(forceOpen);
      localStorage.setItem(STORAGE_KEY_FORCE_OPEN, String(forceOpen));
    }
    updateSalonConfigInSupabase({ forceOnlineQueueOpen: forceOpen });
  };

  // Real-time analytics metrics
  const completedTokens = queue.filter((t) => t.status === 'COMPLETED');
  const noShowTokens = queue.filter((t) => t.status === 'NO_SHOW');
  const todayServedCount = completedTokens.length;
  const todayNoShowCount = noShowTokens.length;

  const todayTotalRevenue = useMemo(() => {
    return completedTokens.reduce((sum, token) => {
      return sum + token.services.reduce((acc, s) => acc + s.priceInr, 0);
    }, 0);
  }, [completedTokens]);

  const todayAvgWaitMins = useMemo(() => {
    if (completedTokens.length === 0) {
      return estimatedGeneralWaitMins || 15;
    }
    const totalWait = completedTokens.reduce((sum, token) => {
      if (token.serviceStartedAt && token.createdAt) {
        const diffMs = new Date(token.serviceStartedAt).getTime() - new Date(token.createdAt).getTime();
        return sum + Math.max(1, Math.round(diffMs / 60000));
      }
      return sum + token.estimatedWaitMinutes;
    }, 0);
    return Math.round((totalWait / completedTokens.length) * 10) / 10;
  }, [completedTokens, estimatedGeneralWaitMins]);

  return (
    <QueueContext.Provider
      value={{
        services,
        barbers,
        queue,
        salonConfig,
        activeWaitingCount,
        estimatedGeneralWaitMins,
        isOnlineQueueOpen,
        currentTime,
        toggleSimulatedQueueHours,
        addTokenToQueue,
        addWalkIn,
        callNextForBarber,
        seatCustomer,
        completeService,
        markNoShow,
        cancelToken,
        toggleBarberBreak,
        isPhoneActiveInQueue,
        findTokenByQuery,
        getBarberWaitMins,
        getTokenPosition,
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
        todayServedCount,
        todayNoShowCount,
        todayAvgWaitMins,
        todayTotalRevenue,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = (): QueueContextType => {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
};
