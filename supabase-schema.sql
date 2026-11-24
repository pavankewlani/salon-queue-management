-- ==============================================================================
-- SALON QUEUE MANAGEMENT SYSTEM — SUPABASE DATABASE SCHEMA & SEED SCRIPT
-- Document ID: SUPABASE-SCHEMA-V1
-- Designed for: PostgreSQL / Supabase
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABLE DEFINITIONS
-- ==============================================================================

-- Table 1: Salon Services Catalog
CREATE TABLE IF NOT EXISTS public.salon_services (
    id TEXT PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_gu TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    price_inr NUMERIC NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    description_en TEXT,
    description_gu TEXT,
    category TEXT NOT NULL DEFAULT 'hair',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table 2: Barber Stations
CREATE TABLE IF NOT EXISTS public.barber_stations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_gu TEXT,
    chair_number INTEGER NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'IDLE', -- 'IDLE' | 'CALLING' | 'IN_SERVICE' | 'ON_BREAK' | 'OFFLINE'
    shift_start TEXT NOT NULL DEFAULT '09:00',
    shift_end TEXT NOT NULL DEFAULT '21:00',
    current_customer_token_id TEXT,
    specialties_en TEXT,
    specialties_gu TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table 3: Queue Entries (Tokens)
CREATE TABLE IF NOT EXISTS public.queue_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    services JSONB NOT NULL DEFAULT '[]'::jsonb,
    barber_preference TEXT NOT NULL DEFAULT 'ANY',
    assigned_barber_id TEXT REFERENCES public.barber_stations(id) ON DELETE SET NULL,
    chair_number INTEGER,
    status TEXT NOT NULL DEFAULT 'WAITING', -- 'WAITING' | 'UP_NEXT' | 'CALLED' | 'IN_SERVICE' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED'
    is_walk_in BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    called_at TIMESTAMPTZ,
    service_started_at TIMESTAMPTZ,
    service_completed_at TIMESTAMPTZ,
    estimated_wait_minutes INTEGER NOT NULL DEFAULT 0
);

-- Table 4: Salon Operational Configuration
CREATE TABLE IF NOT EXISTS public.salon_configuration (
    id TEXT PRIMARY KEY DEFAULT 'default',
    opening_time TEXT NOT NULL DEFAULT '09:00',
    closing_time TEXT NOT NULL DEFAULT '21:00',
    online_cutoff_minutes_before_closing INTEGER NOT NULL DEFAULT 30,
    is_emergency_paused BOOLEAN NOT NULL DEFAULT false,
    force_online_queue_open BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES & ROLE GRANTS
-- ==============================================================================
-- Grant schema and table access to Supabase anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;

-- Enable RLS on all tables
ALTER TABLE public.salon_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barber_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salon_configuration ENABLE ROW LEVEL SECURITY;

-- Allow public read & write access with Supabase anon key
-- (The application enforces authentication & role permissions in the app layer)
DROP POLICY IF EXISTS "Public access to salon_services" ON public.salon_services;
CREATE POLICY "Public access to salon_services" 
ON public.salon_services FOR ALL 
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to barber_stations" ON public.barber_stations;
CREATE POLICY "Public access to barber_stations" 
ON public.barber_stations FOR ALL 
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to queue_entries" ON public.queue_entries;
CREATE POLICY "Public access to queue_entries" 
ON public.queue_entries FOR ALL 
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to salon_configuration" ON public.salon_configuration;
CREATE POLICY "Public access to salon_configuration" 
ON public.salon_configuration FOR ALL 
USING (true) WITH CHECK (true);

-- ==============================================================================
-- 4. REALTIME NOTIFICATIONS (SUPABASE REALTIME PUBLICATION)
-- ==============================================================================
-- Add tables to the supabase_realtime publication for sub-second UI synchronization
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'queue_entries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_entries;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'barber_stations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.barber_stations;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'salon_services'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.salon_services;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'salon_configuration'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.salon_configuration;
  END IF;
END $$;

-- Set replica identity to FULL so realtime events include previous and new row states
ALTER TABLE public.queue_entries REPLICA IDENTITY FULL;
ALTER TABLE public.barber_stations REPLICA IDENTITY FULL;
ALTER TABLE public.salon_services REPLICA IDENTITY FULL;
ALTER TABLE public.salon_configuration REPLICA IDENTITY FULL;

-- ==============================================================================
-- 5. INITIAL SEED DATA
-- ==============================================================================

-- Seed Services
INSERT INTO public.salon_services (id, name_en, name_gu, duration_minutes, price_inr, is_active, description_en, description_gu, category)
VALUES
    ('srv_haircut', 'Haircut & Styling', 'વાળ કાપવા અને સ્ટાઇલિંગ', 30, 250, true, 'Precision scissor haircut with wash and hot towel treatment', 'શ્રેષ્ઠ કાતર હેરકટ, વોશ અને ગરમ ટુવાલ ટ્રીટમેન્ટ', 'hair'),
    ('srv_beard', 'Beard Trim & Shape', 'દાઢી ટ્રિમિંગ અને આકાર', 20, 150, true, 'Sharp beard grooming, razor lining, and organic beard oil finish', 'દાઢી ગ્રૂમિંગ, રેઝર લાઇનિંગ અને ઓર્ગેનિક તેલ ફિનિશ', 'beard'),
    ('srv_shave', 'Luxury Hot Towel Shave', 'લક્ઝરી હોટ ટુવાલ શેવ', 25, 200, true, 'Traditional straight-razor shave with warm lather and essential oils', 'ગરમ ફીણ અને એસેન્શિયલ તેલ સાથે પરંપરાગત શેવ', 'beard'),
    ('srv_wash', 'Hair Wash & Conditioning', 'હેર વોશ અને કન્ડિશનિંગ', 15, 100, true, 'Deep cleansing shampoo and scalp massage with premium conditioner', 'ડીપ ક્લીન્ઝિંગ શેમ્પૂ અને પ્રીમિયમ કન્ડિશનર સાથે મસાજ', 'hair'),
    ('srv_facial', 'Charcoal Facial Treatment', 'ચારકોલ ફેશિયલ ટ્રીટમેન્ટ', 45, 500, true, 'Deep detoxifying pore extraction with organic charcoal mask', 'ઓર્ગેનિક ચારકોલ માસ્ક સાથે ડીપ ડીટોક્સિફાઇંગ ટ્રીટમેન્ટ', 'spa'),
    ('srv_combo', 'Father & Son Combo', 'પિતા અને પુત્ર કોમ્બો', 50, 450, true, 'Two haircuts package with complimentary hair styling products', 'બે હેરકટ્સ પેકેજ સાથે કોમ્પ્લિમેન્ટરી પ્રોડક્ટ્સ', 'hair')
ON CONFLICT (id) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_gu = EXCLUDED.name_gu,
    duration_minutes = EXCLUDED.duration_minutes,
    price_inr = EXCLUDED.price_inr,
    is_active = EXCLUDED.is_active;

-- Seed Barber Stations
INSERT INTO public.barber_stations (id, name, name_gu, chair_number, status, shift_start, shift_end, specialties_en, specialties_gu)
VALUES
    ('barber_1', 'Arjun Patel', 'અર્જુન પટેલ', 1, 'IDLE', '09:00', '21:00', 'Fade specialist & modern precision cuts', 'ફેડ સ્પેશિયાલિસ્ટ અને આધુનિક કટ'),
    ('barber_2', 'Vikram Mehta', 'વિક્રમ મહેતા', 2, 'IDLE', '09:00', '21:00', 'Beard maestro & classic straight-razor shaves', 'દાઢી નિષ્ણાત અને ક્લાસિક શેવ'),
    ('barber_3', 'Rajesh Solanki', 'રાજેશ સોલંકી', 3, 'IDLE', '10:00', '20:00', 'Master stylist & scalp wellness therapy', 'માસ્ટર સ્ટાઈલિસ્ટ અને થેરાપી')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    name_gu = EXCLUDED.name_gu,
    chair_number = EXCLUDED.chair_number,
    shift_start = EXCLUDED.shift_start,
    shift_end = EXCLUDED.shift_end;

-- Seed Salon Configuration
INSERT INTO public.salon_configuration (id, opening_time, closing_time, online_cutoff_minutes_before_closing, is_emergency_paused, force_online_queue_open)
VALUES ('default', '09:00', '21:00', 30, false, true)
ON CONFLICT (id) DO NOTHING;
