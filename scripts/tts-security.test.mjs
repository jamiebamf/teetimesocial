import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
const migration = readFileSync(new URL("../supabase/migrations/20260906221500_tts_admin_server_authorization.sql", import.meta.url), "utf8");
const sqlTest = readFileSync(new URL("../supabase/tests/admin_authorization.sql", import.meta.url), "utf8");
const sqlFixtureUrl = new URL("../supabase/tests/ci_bootstrap.sql", import.meta.url);
const workflow = readFileSync(new URL("../.github/workflows/security-checks.yml", import.meta.url), "utf8");
const stagingE2e = readFileSync(new URL("../supabase/tests/staging_admin_auth_e2e.py", import.meta.url), "utf8");

describe("TTS authorization migration", () => {
  it("explicitly hardens the admin mapping table and prevents self-promotion grants", () => {
    expect(migration).toMatch(/ALTER TABLE public\.tts_admin_users ENABLE ROW LEVEL SECURITY/i);
    expect(migration).toMatch(/REVOKE ALL(?: PRIVILEGES)? ON (?:TABLE )?public\.tts_admin_users FROM (?:PUBLIC, )?anon, authenticated/i);
    expect(migration).toMatch(/GRANT SELECT ON (?:TABLE )?public\.tts_admin_users TO authenticated/i);
    expect(migration).toMatch(/CREATE POLICY "admins can read admin access"[\s\S]*FOR SELECT[\s\S]*TO authenticated[\s\S]*USING \(public\.is_tts_admin\(\)\)/i);
  });

  it("enables booking RLS and exposes only a narrow anonymous availability RPC", () => {
    expect(migration).toMatch(/ALTER TABLE public\.simulator_bookings ENABLE ROW LEVEL SECURITY/i);
    expect(migration).toMatch(/RETURNS TABLE \([\s\S]*booking_time text[\s\S]*booking_end_time text[\s\S]*duration integer[\s\S]*\)/i);
    expect(migration).toMatch(/REVOKE ALL ON FUNCTION public\.get_simulator_occupied_slots\(date, text\) FROM PUBLIC/i);
    expect(migration).toMatch(/GRANT EXECUTE ON FUNCTION public\.get_simulator_occupied_slots\(date, text\) TO anon, authenticated/i);
  });

  it("keeps the dormant public booking page away from direct booking reads", () => {
    const bookingPage = app.slice(app.indexOf("function BookSimulatorPage"), app.indexOf("function PackagesPage"));
    expect(bookingPage).not.toMatch(/\.from\("simulator_bookings"\)[\s\S]{0,120}\.select\(/);
    expect(bookingPage.match(/loadOccupiedSlots\(/g)).toHaveLength(2);
  });

  it("routes every protected-page authorization transition through one controller", () => {
    const protectedPage = app.slice(app.indexOf("function ProtectedAdminPage"), app.indexOf("function AdminPage"));
    expect(protectedPage).toMatch(/useRef\(new AdminAuthorizationController\(\)\)/);
    expect(protectedPage.match(/authorizationController\.run\(/g)).toHaveLength(4);
    expect(protectedPage).toMatch(/authorizeAdminSession\([\s\S]*session[\s\S]*session\?\.user\.id/);
  });
});

describe("hermetic SQL authorization test", () => {
  it("executes the fixture, migration, and actual SQL authorization test in CI", () => {
    expect(sqlFixtureUrl.pathname).toMatch(/ci_bootstrap\.sql$/);
    expect(workflow).toMatch(/services:[\s\S]*postgres:/);
    expect(workflow).toMatch(/psql[^\n]*-f supabase\/tests\/ci_bootstrap\.sql/);
    expect(workflow).toMatch(/psql[^\n]*-f supabase\/migrations\/20260906221500_tts_admin_server_authorization\.sql/);
    expect(workflow).toMatch(/psql[^\n]*-f supabase\/tests\/admin_authorization\.sql/);
  });

  it("keeps JWT expiration at the gateway E2E layer and labels SQL missing identity accurately", () => {
    expect(sqlTest).toMatch(/missing identity also fails closed/i);
    expect(sqlTest).not.toMatch(/missing\/expired identity/i);
    expect(stagingE2e).toMatch(/expired_token\(nonadmin_id\)/);
    expect(stagingE2e).toMatch(/status\s*==\s*401/);
    expect(stagingE2e).toMatch(/expired_session[\s\S]*rejected[\s\S]*is True/);
  });

  it("seeds identities, mappings and protected rows and rolls all changes back", () => {
    expect(sqlTest).toMatch(/INSERT INTO auth\.users/i);
    expect(sqlTest).toMatch(/INSERT INTO public\.tts_admin_users/i);
    for (const table of ["leads", "private_hire_enquiries", "memberships", "simulator_bookings"]) {
      expect(sqlTest).toMatch(new RegExp(`INSERT INTO public\\.${table}`, "i"));
    }
    expect(sqlTest).toMatch(/self-promotion/i);
    expect(sqlTest).toMatch(/FROM pg_policies/i);
    expect(sqlTest.trimEnd()).toMatch(/ROLLBACK;$/i);
  });
});
