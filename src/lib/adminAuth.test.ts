import { describe, expect, it, vi } from "vitest";
import {
  AdminAuthorizationController,
  checkAdminSession,
  revalidateAdminSession,
  signInAdmin,
  type AdminAuthClient,
  type AdminAuthResult
} from "./adminAuth";

const session = { user: { id: "user-123" } };

function clientFor(options: {
  existingSession?: typeof session | null;
  sessionError?: string;
  signInError?: string;
  isAdmin?: boolean;
  adminCheckError?: string;
  rejectGetSession?: boolean;
  rejectSignIn?: boolean;
  rejectAdminCheck?: boolean;
  rejectSignOut?: boolean;
} = {}) {
  const signOut = vi.fn(() => options.rejectSignOut
    ? Promise.reject(new Error("sign out rejected"))
    : Promise.resolve({ error: null }));
  const client: AdminAuthClient = {
    auth: {
      getSession: vi.fn(() => options.rejectGetSession
        ? Promise.reject(new Error("get session rejected"))
        : Promise.resolve({
          data: { session: options.existingSession === undefined ? session : options.existingSession },
          error: options.sessionError ? { message: options.sessionError } : null
        })),
      signInWithPassword: vi.fn(() => options.rejectSignIn
        ? Promise.reject(new Error("sign in rejected"))
        : Promise.resolve({
          data: { session: options.signInError ? null : session },
          error: options.signInError ? { message: options.signInError } : null
        })),
      signOut
    },
    rpc: vi.fn(() => options.rejectAdminCheck
      ? Promise.reject(new Error("RPC rejected"))
      : Promise.resolve({
        data: options.isAdmin ?? false,
        error: options.adminCheckError ? { message: options.adminCheckError } : null
      }))
  };
  return { client, signOut };
}

describe("checkAdminSession", () => {
  it("rejects an unauthenticated visitor before any admin lookup", async () => {
    const { client } = clientFor({ existingSession: null });

    await expect(checkAdminSession(client)).resolves.toEqual({ status: "unauthenticated" });
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it("signs out an authenticated non-admin", async () => {
    const { client, signOut } = clientFor({ isAdmin: false });

    await expect(checkAdminSession(client)).resolves.toEqual({ status: "forbidden" });
    expect(client.rpc).toHaveBeenCalledWith("is_tts_admin");
    expect(signOut).toHaveBeenCalledOnce();
  });

  it("accepts an authenticated member of tts_admin_users", async () => {
    const { client, signOut } = clientFor({ isAdmin: true });

    const result = await checkAdminSession(client);

    expect(result.status).toBe("authorized");
    expect(signOut).not.toHaveBeenCalled();
  });

  it("does not authorize when the current token belongs to a different user", async () => {
    const { client, signOut } = clientFor({ isAdmin: true });
    client.auth.getSession = vi.fn()
      .mockResolvedValueOnce({ data: { session }, error: null })
      .mockResolvedValueOnce({ data: { session: { user: { id: "later-user" } } }, error: null });

    await expect(checkAdminSession(client)).resolves.toEqual({ status: "unauthenticated" });
    expect(client.rpc).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
  });

  it("fails closed and clears the session when getSession rejects", async () => {
    const { client, signOut } = clientFor({ rejectGetSession: true });

    await expect(checkAdminSession(client)).resolves.toEqual({ status: "error" });
    expect(signOut).toHaveBeenCalledOnce();
  });

  it("fails closed when clearing an invalid session also rejects", async () => {
    const { client, signOut } = clientFor({ sessionError: "JWT expired", rejectSignOut: true });

    await expect(checkAdminSession(client)).resolves.toEqual({ status: "expired" });
    expect(signOut).toHaveBeenCalledOnce();
  });
});

describe("signInAdmin", () => {
  it("uses Supabase password auth and then requires server-side admin membership", async () => {
    const { client } = clientFor({ isAdmin: true });

    const credential = "not-a-real-password";
    await expect(signInAdmin(client, "admin@example.com", credential)).resolves.toMatchObject({
      status: "authorized"
    });
    expect(client.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "admin@example.com",
      password: credential
    });
    expect(client.rpc).toHaveBeenCalledWith("is_tts_admin");
  });

  it("clears any existing session when sign-in returns an auth error", async () => {
    const { client, signOut } = clientFor({ signInError: "invalid login" });

    await expect(signInAdmin(client, "admin@example.com", "invalid")).resolves.toEqual({ status: "unauthenticated" });
    expect(signOut).toHaveBeenCalledOnce();
  });

  it("fails closed and clears the session when sign-in rejects", async () => {
    const { client, signOut } = clientFor({ rejectSignIn: true });

    await expect(signInAdmin(client, "admin@example.com", "invalid")).resolves.toEqual({ status: "error" });
    expect(signOut).toHaveBeenCalledOnce();
  });

  it("fails closed and clears the session when the membership RPC rejects", async () => {
    const { client, signOut } = clientFor({ rejectAdminCheck: true });

    await expect(signInAdmin(client, "admin@example.com", "invalid")).resolves.toEqual({ status: "error" });
    expect(signOut).toHaveBeenCalledOnce();
  });
});

describe("AdminAuthorizationController", () => {
  it("ignores a successful login that resolves after a later auth transition", async () => {
    const controller = new AdminAuthorizationController();
    const applied: AdminAuthResult[] = [];
    let resolveLogin: ((result: AdminAuthResult) => void) | undefined;
    const loginResult = new Promise<AdminAuthResult>((resolve) => {
      resolveLogin = resolve;
    });

    const pendingLogin = controller.run(
      () => loginResult,
      session.user.id,
      (result) => applied.push(result)
    );
    await controller.run(
      async () => ({ status: "unauthenticated" }),
      null,
      (result) => applied.push(result)
    );
    resolveLogin?.({ status: "authorized", session });

    await expect(pendingLogin).resolves.toBe(false);
    expect(applied).toEqual([{ status: "unauthenticated" }]);
  });

  it("downgrades an authorised result for a different expected user", async () => {
    const controller = new AdminAuthorizationController();
    const apply = vi.fn();

    await expect(controller.run(
      async () => ({ status: "authorized", session }),
      "different-user",
      apply
    )).resolves.toBe(true);

    expect(apply).toHaveBeenCalledWith({ status: "unauthenticated" });
  });
});

describe("revalidateAdminSession", () => {
  it("clears existing authorization synchronously before checking the current identity", async () => {
    const { client } = clientFor({ isAdmin: true });
    let releaseCheck: (() => void) | undefined;
    client.auth.getSession = vi.fn()
      .mockImplementationOnce(async () => {
        await new Promise<void>((resolve) => {
          releaseCheck = resolve;
        });
        return { data: { session }, error: null };
      })
      .mockResolvedValue({ data: { session }, error: null });
    const clearAuthorization = vi.fn();

    const resultPromise = revalidateAdminSession(client, clearAuthorization);

    expect(clearAuthorization).toHaveBeenCalledOnce();
    expect(client.auth.getSession).toHaveBeenCalledOnce();
    releaseCheck?.();
    await expect(resultPromise).resolves.toMatchObject({ status: "authorized" });
  });
});
