BEGIN;

-- Keep the admin mapping private and make its grants/policies reproducible.
ALTER TABLE public.tts_admin_users ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.tts_admin_users FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.tts_admin_users TO authenticated;

DO $policy_cleanup$
DECLARE policy_record record;
BEGIN
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'tts_admin_users'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.tts_admin_users', policy_record.policyname);
  END LOOP;
END;
$policy_cleanup$;

-- The admin predicate is the single server-side source of truth.
CREATE OR REPLACE FUNCTION public.is_tts_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tts_admin_users AS admin_user
    WHERE admin_user.user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_tts_admin() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_tts_admin() TO authenticated;

CREATE POLICY "admins can read admin access"
ON public.tts_admin_users
FOR SELECT
TO authenticated
USING (public.is_tts_admin());

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_hire_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulator_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can submit leads" ON public.leads;
CREATE POLICY "Public can submit leads"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "TTS admins read leads" ON public.leads;
CREATE POLICY "TTS admins read leads"
ON public.leads
FOR SELECT
TO authenticated
USING (public.is_tts_admin());

DROP POLICY IF EXISTS "Public can submit private hire enquiries" ON public.private_hire_enquiries;
CREATE POLICY "Public can submit private hire enquiries"
ON public.private_hire_enquiries
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "TTS admins read private hire enquiries" ON public.private_hire_enquiries;
CREATE POLICY "TTS admins read private hire enquiries"
ON public.private_hire_enquiries
FOR SELECT
TO authenticated
USING (public.is_tts_admin());

DROP POLICY IF EXISTS "Public can join membership waiting list" ON public.memberships;
CREATE POLICY "Public can join membership waiting list"
ON public.memberships
FOR INSERT
TO anon, authenticated
WITH CHECK (status = 'waiting');

DROP POLICY IF EXISTS "TTS admins read memberships" ON public.memberships;
CREATE POLICY "TTS admins read memberships"
ON public.memberships
FOR SELECT
TO authenticated
USING (public.is_tts_admin());

DROP POLICY IF EXISTS "TTS admins update memberships" ON public.memberships;
CREATE POLICY "TTS admins update memberships"
ON public.memberships
FOR UPDATE
TO authenticated
USING (public.is_tts_admin())
WITH CHECK (public.is_tts_admin());

-- Remove every legacy booking policy before installing the admin-only policy.
DO $policy_cleanup$
DECLARE policy_record record;
BEGIN
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'simulator_bookings'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.simulator_bookings', policy_record.policyname);
  END LOOP;
END;
$policy_cleanup$;

CREATE POLICY "TTS admins read bookings"
ON public.simulator_bookings
FOR SELECT
TO authenticated
USING (public.is_tts_admin());

CREATE POLICY "TTS admins update bookings"
ON public.simulator_bookings
FOR UPDATE
TO authenticated
USING (public.is_tts_admin())
WITH CHECK (public.is_tts_admin());

-- Public availability exposes occupied times only, never booking identity/contact data.
CREATE OR REPLACE FUNCTION public.get_simulator_occupied_slots(
  p_booking_date date,
  p_simulator text
)
RETURNS TABLE (
  booking_time text,
  booking_end_time text,
  duration integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT
    booking.booking_time::text,
    booking.booking_end_time::text,
    booking.duration::integer
  FROM public.simulator_bookings AS booking
  WHERE booking.booking_date = p_booking_date
    AND booking.simulator = p_simulator
    AND booking.booking_status IN ('pending', 'confirmed')
  ORDER BY booking.booking_time;
$$;

REVOKE ALL ON FUNCTION public.get_simulator_occupied_slots(date, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_simulator_occupied_slots(date, text) TO anon, authenticated;

-- Replace inherited broad grants with the minimum operations used by public forms/admin UI.
REVOKE ALL PRIVILEGES ON TABLE public.leads FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.private_hire_enquiries FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.memberships FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.simulator_bookings FROM PUBLIC, anon, authenticated;
GRANT INSERT ON TABLE public.leads TO anon, authenticated;
GRANT INSERT ON TABLE public.private_hire_enquiries TO anon, authenticated;
GRANT INSERT ON TABLE public.memberships TO anon, authenticated;
GRANT SELECT ON TABLE public.leads TO authenticated;
GRANT SELECT ON TABLE public.private_hire_enquiries TO authenticated;
GRANT SELECT, UPDATE ON TABLE public.memberships TO authenticated;
GRANT SELECT, UPDATE ON TABLE public.simulator_bookings TO authenticated;

COMMIT;
