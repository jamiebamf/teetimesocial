\set ON_ERROR_STOP on
BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.assert_true(condition boolean, message text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF condition IS NOT TRUE THEN
    RAISE EXCEPTION 'assertion failed: %', message;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION pg_temp.assert_denied(statement text, message text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  BEGIN
    EXECUTE statement;
  EXCEPTION WHEN insufficient_privilege THEN
    RETURN;
  END;
  RAISE EXCEPTION 'assertion failed: %', message;
END;
$$;

-- Fixed identities and protected rows make this test independent of staging contents.
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) VALUES
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'sql-admin@example.invalid', '', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'sql-nonadmin@example.invalid', '', now(), now(), now());

INSERT INTO public.tts_admin_users (user_id)
VALUES ('10000000-0000-4000-8000-000000000001');

INSERT INTO public.leads (full_name, email)
VALUES ('SQL authorization lead', 'sql-lead@example.invalid');
INSERT INTO public.private_hire_enquiries (full_name, email)
VALUES ('SQL authorization hire', 'sql-hire@example.invalid');
INSERT INTO public.memberships (full_name, email, membership_type, status)
VALUES ('SQL authorization member', 'sql-member@example.invalid', 'waiting-list-test', 'waiting');
INSERT INTO public.simulator_bookings (
  full_name, email, phone, booking_date, booking_time, booking_end_time,
  duration, group_size, simulator, club_hire, deposit_amount,
  booking_status, payment_status
) VALUES (
  'SQL authorization booking', 'sql-booking@example.invalid', '00000000000',
  DATE '2099-01-02', TIME '10:00', TIME '11:00', 60, 2,
  'Bay 1 - Golfzon TwoVision', false, 20, 'pending', 'unpaid'
);

-- Anonymous users can submit the three public forms but cannot read protected tables.
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.sub', '', true);
SELECT pg_temp.assert_denied('SELECT * FROM public.leads', 'anonymous user can read leads');
SELECT pg_temp.assert_denied('SELECT * FROM public.private_hire_enquiries', 'anonymous user can read private hire enquiries');
SELECT pg_temp.assert_denied('SELECT * FROM public.memberships', 'anonymous user can read memberships');
SELECT pg_temp.assert_denied('SELECT * FROM public.simulator_bookings', 'anonymous user can read bookings');
INSERT INTO public.leads (full_name, email) VALUES ('Anonymous test', 'anon-lead@example.invalid');
INSERT INTO public.private_hire_enquiries (full_name, email) VALUES ('Anonymous test', 'anon-hire@example.invalid');
INSERT INTO public.memberships (full_name, email, membership_type, status)
VALUES ('Anonymous test', 'anon-member@example.invalid', 'waiting-list-test', 'waiting');
SELECT pg_temp.assert_true(
  (SELECT count(*) FROM public.get_simulator_occupied_slots(DATE '2099-01-02', 'Bay 1 - Golfzon TwoVision')) = 1,
  'anonymous availability RPC cannot see occupied slot'
);

-- An authenticated non-admin sees no rows, cannot mutate, and cannot self-promote.
RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
SELECT pg_temp.assert_true(NOT public.is_tts_admin(), 'non-admin classified as admin');
SELECT pg_temp.assert_true((SELECT count(*) FROM public.tts_admin_users) = 0, 'non-admin can read admin mappings');
SELECT pg_temp.assert_true((SELECT count(*) FROM public.leads) = 0, 'non-admin can read leads');
SELECT pg_temp.assert_true((SELECT count(*) FROM public.private_hire_enquiries) = 0, 'non-admin can read private hire enquiries');
SELECT pg_temp.assert_true((SELECT count(*) FROM public.memberships) = 0, 'non-admin can read memberships');
SELECT pg_temp.assert_true((SELECT count(*) FROM public.simulator_bookings) = 0, 'non-admin can read bookings');
SELECT pg_temp.assert_denied(
  $$INSERT INTO public.tts_admin_users (user_id) VALUES ('10000000-0000-4000-8000-000000000002')$$,
  'non-admin self-promotion succeeded'
);
DO $$
DECLARE membership_changes integer;
DECLARE booking_changes integer;
BEGIN
  UPDATE public.memberships SET status = 'active';
  GET DIAGNOSTICS membership_changes = ROW_COUNT;
  PERFORM pg_temp.assert_true(membership_changes = 0, 'non-admin can update memberships');
  UPDATE public.simulator_bookings SET booking_status = 'confirmed';
  GET DIAGNOSTICS booking_changes = ROW_COUNT;
  PERFORM pg_temp.assert_true(booking_changes = 0, 'non-admin can update bookings');
END;
$$;

-- A missing identity also fails closed.
SELECT set_config('request.jwt.claim.sub', '', true);
SELECT pg_temp.assert_true(NOT public.is_tts_admin(), 'missing subject classified as admin');
SELECT pg_temp.assert_true((SELECT count(*) FROM public.leads) = 0, 'missing subject can read leads');

-- The seeded admin can read every dashboard table and perform intended updates.
RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
SELECT pg_temp.assert_true(public.is_tts_admin(), 'admin membership not recognised');
SELECT pg_temp.assert_true(
  EXISTS (SELECT 1 FROM public.tts_admin_users WHERE user_id = '10000000-0000-4000-8000-000000000001'),
  'admin cannot read own admin mapping row');
SELECT pg_temp.assert_true((SELECT count(*) FROM public.leads) >= 1, 'admin cannot read leads');
SELECT pg_temp.assert_true((SELECT count(*) FROM public.private_hire_enquiries) >= 1, 'admin cannot read private hire enquiries');
SELECT pg_temp.assert_true((SELECT count(*) FROM public.memberships) >= 1, 'admin cannot read memberships');
SELECT pg_temp.assert_true((SELECT count(*) FROM public.simulator_bookings) = 1, 'admin cannot read bookings');
DO $$
DECLARE membership_changes integer;
DECLARE booking_changes integer;
BEGIN
  UPDATE public.memberships SET status = status;
  GET DIAGNOSTICS membership_changes = ROW_COUNT;
  PERFORM pg_temp.assert_true(membership_changes >= 1, 'admin cannot update memberships');
  UPDATE public.simulator_bookings SET booking_status = booking_status;
  GET DIAGNOSTICS booking_changes = ROW_COUNT;
  PERFORM pg_temp.assert_true(booking_changes = 1, 'admin cannot update bookings');
END;
$$;

-- Catalog assertions verify server-side policy shape, RLS and least-privilege grants.
RESET ROLE;
SELECT pg_temp.assert_true(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.tts_admin_users'::regclass),
  'tts_admin_users RLS is disabled'
);
SELECT pg_temp.assert_true(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.simulator_bookings'::regclass),
  'simulator_bookings RLS is disabled'
);
SELECT pg_temp.assert_true(
  (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tts_admin_users') = 1
  AND EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'tts_admin_users'
      AND policyname = 'admins can read admin access'
      AND cmd = 'SELECT'
      AND roles = ARRAY['authenticated']::name[]
      AND qual = 'is_tts_admin()'
  ),
  'admin mapping policy is not admin-only SELECT'
);
SELECT pg_temp.assert_true(
  (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'simulator_bookings') = 2
  AND EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'simulator_bookings'
      AND policyname = 'TTS admins read bookings'
      AND cmd = 'SELECT'
      AND roles = ARRAY['authenticated']::name[]
      AND qual = 'is_tts_admin()'
  )
  AND EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'simulator_bookings'
      AND policyname = 'TTS admins update bookings'
      AND cmd = 'UPDATE'
      AND roles = ARRAY['authenticated']::name[]
      AND qual = 'is_tts_admin()'
      AND with_check = 'is_tts_admin()'
  ),
  'booking policies do not match intended admin read/update access'
);
SELECT pg_temp.assert_true(
  has_table_privilege('authenticated', 'public.tts_admin_users', 'SELECT')
  AND NOT has_table_privilege('authenticated', 'public.tts_admin_users', 'INSERT')
  AND NOT has_table_privilege('authenticated', 'public.tts_admin_users', 'UPDATE')
  AND NOT has_table_privilege('authenticated', 'public.tts_admin_users', 'DELETE')
  AND NOT has_table_privilege('authenticated', 'public.tts_admin_users', 'TRUNCATE')
  AND NOT has_table_privilege('authenticated', 'public.tts_admin_users', 'REFERENCES')
  AND NOT has_table_privilege('authenticated', 'public.tts_admin_users', 'TRIGGER')
  AND NOT has_table_privilege('anon', 'public.tts_admin_users', 'SELECT')
  AND NOT has_table_privilege('anon', 'public.tts_admin_users', 'INSERT')
  AND NOT has_table_privilege('anon', 'public.tts_admin_users', 'UPDATE')
  AND NOT has_table_privilege('anon', 'public.tts_admin_users', 'DELETE')
  AND NOT has_table_privilege('anon', 'public.tts_admin_users', 'TRUNCATE')
  AND NOT has_table_privilege('anon', 'public.tts_admin_users', 'REFERENCES')
  AND NOT has_table_privilege('anon', 'public.tts_admin_users', 'TRIGGER'),
  'admin mapping grants permit self-promotion or mutation'
);
SELECT pg_temp.assert_true(
  has_table_privilege('authenticated', 'public.simulator_bookings', 'SELECT')
  AND has_table_privilege('authenticated', 'public.simulator_bookings', 'UPDATE')
  AND NOT has_table_privilege('authenticated', 'public.simulator_bookings', 'INSERT')
  AND NOT has_table_privilege('authenticated', 'public.simulator_bookings', 'DELETE')
  AND NOT has_table_privilege('authenticated', 'public.simulator_bookings', 'TRUNCATE')
  AND NOT has_table_privilege('authenticated', 'public.simulator_bookings', 'REFERENCES')
  AND NOT has_table_privilege('authenticated', 'public.simulator_bookings', 'TRIGGER')
  AND NOT has_table_privilege('anon', 'public.simulator_bookings', 'SELECT')
  AND NOT has_table_privilege('anon', 'public.simulator_bookings', 'INSERT')
  AND NOT has_table_privilege('anon', 'public.simulator_bookings', 'UPDATE')
  AND NOT has_table_privilege('anon', 'public.simulator_bookings', 'DELETE')
  AND NOT has_table_privilege('anon', 'public.simulator_bookings', 'TRUNCATE')
  AND NOT has_table_privilege('anon', 'public.simulator_bookings', 'REFERENCES')
  AND NOT has_table_privilege('anon', 'public.simulator_bookings', 'TRIGGER'),
  'booking table grants are broader than intended'
);
SELECT pg_temp.assert_true(
  has_function_privilege('anon', 'public.get_simulator_occupied_slots(date,text)', 'EXECUTE')
  AND has_function_privilege('authenticated', 'public.get_simulator_occupied_slots(date,text)', 'EXECUTE'),
  'availability RPC execute grants are missing'
);

ROLLBACK;
