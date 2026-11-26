import { createClient } from '@supabase/supabase-js';
import { QueueToken, ServiceItem, BarberStation, SalonConfiguration } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

// Check if credentials are real (not default placeholders) and not running inside test runner
export const isSupabaseConfigured = Boolean(
  import.meta.env.MODE !== 'test' &&
  import.meta.env.VITE_SUPABASE_URL && 
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  !import.meta.env.VITE_SUPABASE_URL.includes('your-project') &&
  !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')
);

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Saves a new queue entry to Supabase if configured.
 * Catches and logs any network or table errors without interrupting the client experience.
 */
export async function saveQueueEntryToSupabase(token: QueueToken): Promise<boolean> {
  if (!isSupabaseConfigured) {
    // Supabase is using local/offline storage mode
    return false;
  }

  try {
    const { error } = await supabase.from('queue_entries').insert([
      {
        token_id: token.id,
        customer_name: token.customerName,
        customer_phone: token.customerPhone,
        services: token.services,
        barber_preference: token.barberPreference,
        assigned_barber_id: token.assignedBarberId || null,
        chair_number: token.chairNumber || null,
        status: token.status,
        is_walk_in: token.isWalkIn,
        created_at: token.createdAt,
        estimated_wait_minutes: token.estimatedWaitMinutes,
      },
    ]);

    if (error) {
      console.warn('Supabase queue insert skipped / table note:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase offline / fallback active:', err);
    return false;
  }
}

/**
 * Updates an existing queue token in Supabase (e.g. status transition to CANCELLED or CALLED).
 */
export async function updateQueueEntryInSupabase(
  tokenId: string,
  updates: Partial<QueueToken>
): Promise<boolean> {
  if (!isSupabaseConfigured) {
    return false;
  }

  try {
    const payload: Record<string, unknown> = {};
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.assignedBarberId !== undefined) payload.assigned_barber_id = updates.assignedBarberId;
    if (updates.chairNumber !== undefined) payload.chair_number = updates.chairNumber;
    if (updates.calledAt !== undefined) payload.called_at = updates.calledAt;
    if (updates.serviceStartedAt !== undefined) payload.service_started_at = updates.serviceStartedAt;
    if (updates.serviceCompletedAt !== undefined) payload.service_completed_at = updates.serviceCompletedAt;
    if (updates.estimatedWaitMinutes !== undefined) payload.estimated_wait_minutes = updates.estimatedWaitMinutes;

    const { error } = await supabase
      .from('queue_entries')
      .update(payload)
      .eq('token_id', tokenId);

    if (error) {
      console.warn('Supabase update note:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase update offline fallback:', err);
    return false;
  }
}

/**
 * Saves a new service item or updates an existing one in Supabase.
 */
export async function saveServiceToSupabase(service: ServiceItem): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    const { error } = await supabase.from('salon_services').upsert([
      {
        id: service.id,
        name_en: service.nameEn,
        name_gu: service.nameGu,
        duration_minutes: service.durationMinutes,
        price_inr: service.priceInr,
        is_active: service.isActive,
        description_en: service.descriptionEn || null,
        description_gu: service.descriptionGu || null,
        category: service.category || 'hair',
      },
    ]);

    if (error) {
      console.warn('Supabase service upsert note:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase service offline fallback:', err);
    return false;
  }
}

/**
 * Updates an existing service in Supabase (e.g., duration, price, disabled status).
 */
export async function updateServiceInSupabase(
  serviceId: string,
  updates: Partial<ServiceItem>
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    const payload: Record<string, unknown> = {};
    if (updates.nameEn !== undefined) payload.name_en = updates.nameEn;
    if (updates.nameGu !== undefined) payload.name_gu = updates.nameGu;
    if (updates.durationMinutes !== undefined) payload.duration_minutes = updates.durationMinutes;
    if (updates.priceInr !== undefined) payload.price_inr = updates.priceInr;
    if (updates.isActive !== undefined) payload.is_active = updates.isActive;
    if (updates.category !== undefined) payload.category = updates.category;

    const { error } = await supabase
      .from('salon_services')
      .update(payload)
      .eq('id', serviceId);

    if (error) {
      console.warn('Supabase service update note:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase service update fallback:', err);
    return false;
  }
}

/**
 * Updates a barber station status or shift in Supabase.
 */
export async function updateBarberInSupabase(
  barberId: string,
  updates: Partial<BarberStation>
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    const payload: Record<string, unknown> = {};
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.shiftStart !== undefined) payload.shift_start = updates.shiftStart;
    if (updates.shiftEnd !== undefined) payload.shift_end = updates.shiftEnd;
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.chairNumber !== undefined) payload.chair_number = updates.chairNumber;
    if ('currentCustomerTokenId' in updates) {
      payload.current_customer_token_id = updates.currentCustomerTokenId ?? null;
    }

    const { error } = await supabase
      .from('barber_stations')
      .update(payload)
      .eq('id', barberId);

    if (error) {
      console.warn('Supabase barber update note:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase barber update fallback:', err);
    return false;
  }
}

/**
 * Updates salon configuration (hours, cutoff, emergency status) in Supabase.
 */
export async function updateSalonConfigInSupabase(
  config: Partial<SalonConfiguration>
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    const payload: Record<string, unknown> = { id: 'default' };
    if (config.openingTime !== undefined) payload.opening_time = config.openingTime;
    if (config.closingTime !== undefined) payload.closing_time = config.closingTime;
    if (config.onlineCutoffMinutesBeforeClosing !== undefined) {
      payload.online_cutoff_minutes_before_closing = config.onlineCutoffMinutesBeforeClosing;
    }
    if (config.isEmergencyPaused !== undefined) payload.is_emergency_paused = config.isEmergencyPaused;
    if (config.forceOnlineQueueOpen !== undefined) payload.force_online_queue_open = config.forceOnlineQueueOpen;

    const { error } = await supabase.from('salon_configuration').upsert([payload]);

    if (error) {
      console.warn('Supabase salon config note:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase salon config fallback:', err);
    return false;
  }
}

/**
 * Fetches all queue entries from Supabase.
 */
export async function fetchQueueFromSupabase(): Promise<QueueToken[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('queue_entries')
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !data) return [];
    return data.map((row) => ({
      id: row.token_id,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      services: row.services || [],
      barberPreference: row.barber_preference,
      assignedBarberId: row.assigned_barber_id || undefined,
      chairNumber: row.chair_number || undefined,
      status: row.status,
      isWalkIn: row.is_walk_in,
      createdAt: row.created_at,
      calledAt: row.called_at || undefined,
      serviceStartedAt: row.service_started_at || undefined,
      serviceCompletedAt: row.service_completed_at || undefined,
      estimatedWaitMinutes: row.estimated_wait_minutes || 0,
    }));
  } catch (err) {
    console.warn('Supabase fetchQueue error:', err);
    return [];
  }
}

/**
 * Fetches all services from Supabase.
 */
export async function fetchServicesFromSupabase(): Promise<ServiceItem[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('salon_services')
      .select('*')
      .order('price_inr', { ascending: true });

    if (error || !data) return [];
    return data.map((row) => ({
      id: row.id,
      nameEn: row.name_en,
      nameGu: row.name_gu,
      durationMinutes: row.duration_minutes,
      priceInr: Number(row.price_inr),
      isActive: row.is_active,
      descriptionEn: row.description_en || undefined,
      descriptionGu: row.description_gu || undefined,
      category: row.category || 'hair',
    }));
  } catch (err) {
    console.warn('Supabase fetchServices error:', err);
    return [];
  }
}

/**
 * Fetches all barber stations from Supabase.
 */
export async function fetchBarbersFromSupabase(): Promise<BarberStation[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('barber_stations')
      .select('*')
      .order('chair_number', { ascending: true });

    if (error || !data) return [];
    return data.map((row) => ({
      id: row.id,
      name: row.name,
      nameGu: row.name_gu || undefined,
      chairNumber: row.chair_number,
      status: row.status,
      currentCustomerTokenId: row.current_customer_token_id || undefined,
      shiftStart: row.shift_start || '09:00',
      shiftEnd: row.shift_end || '21:00',
      specialtiesEn: row.specialties_en || undefined,
      specialtiesGu: row.specialties_gu || undefined,
    }));
  } catch (err) {
    console.warn('Supabase fetchBarbers error:', err);
    return [];
  }
}

/**
 * Fetches salon configuration from Supabase.
 */
export async function fetchSalonConfigFromSupabase(): Promise<Partial<SalonConfiguration> | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('salon_configuration')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (error || !data) return null;
    return {
      openingTime: data.opening_time,
      closingTime: data.closing_time,
      onlineCutoffMinutesBeforeClosing: data.online_cutoff_minutes_before_closing,
      isEmergencyPaused: data.is_emergency_paused,
      forceOnlineQueueOpen: data.force_online_queue_open,
    };
  } catch (err) {
    console.warn('Supabase fetchSalonConfig error:', err);
    return null;
  }
}

/**
 * Status information for database connectivity.
 */
export interface SupabaseConnectionStatus {
  isConfigured: boolean;
  isConnected: boolean;
  url: string;
  error?: string;
  rowCount?: number;
}

/**
 * Pings Supabase to verify live database connectivity and table permissions.
 */
export async function checkSupabaseConnection(): Promise<SupabaseConnectionStatus> {
  if (!isSupabaseConfigured) {
    return {
      isConfigured: false,
      isConnected: false,
      url: supabaseUrl,
      error: 'Using local storage mode (credentials are default placeholders)',
    };
  }

  try {
    const { data, error } = await supabase
      .from('salon_services')
      .select('id')
      .limit(1);

    if (error) {
      return {
        isConfigured: true,
        isConnected: false,
        url: supabaseUrl,
        error: error.message,
      };
    }

    return {
      isConfigured: true,
      isConnected: true,
      url: supabaseUrl,
      rowCount: data ? data.length : 0,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      isConfigured: true,
      isConnected: false,
      url: supabaseUrl,
      error: message || 'Network connection failed',
    };
  }
}

/**
 * Subscribes to real-time database changes on Supabase.
 */
export function subscribeToSupabaseRealtime(callbacks: {
  onQueueChange?: () => void;
  onBarbersChange?: () => void;
  onServicesChange?: () => void;
  onConfigChange?: () => void;
}): () => void {
  if (!isSupabaseConfigured) return () => {};

  const channel = supabase
    .channel('salon-db-sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'queue_entries' },
      () => callbacks.onQueueChange?.()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'barber_stations' },
      () => callbacks.onBarbersChange?.()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'salon_services' },
      () => callbacks.onServicesChange?.()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'salon_configuration' },
      () => callbacks.onConfigChange?.()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
