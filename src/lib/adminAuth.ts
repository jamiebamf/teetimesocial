export type AdminSession = {
  user: { id: string };
};

type AuthError = { message: string };

type AuthResponse = {
  data: { session: AdminSession | null };
  error: AuthError | null;
};

export type AdminAuthClient = {
  auth: {
    getSession: () => Promise<AuthResponse>;
    signInWithPassword: (credentials: { email: string; password: string }) => Promise<AuthResponse>;
    signOut: () => Promise<{ error: AuthError | null }>;
  };
  rpc: (name: "is_tts_admin") => Promise<{ data: boolean | null; error: AuthError | null }>;
};

export type AdminAuthResult =
  | { status: "authorized"; session: AdminSession }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "expired" }
  | { status: "error" };

export class AdminAuthorizationController {
  private sequence = 0;

  invalidate(): void {
    this.sequence += 1;
  }

  async run(
    operation: () => Promise<AdminAuthResult>,
    expectedUserId: string | null,
    apply: (result: AdminAuthResult) => void
  ): Promise<boolean> {
    const sequence = ++this.sequence;
    let result: AdminAuthResult;
    try {
      result = await operation();
    } catch {
      result = { status: "error" };
    }

    if (sequence !== this.sequence) {
      return false;
    }
    if (result.status === "authorized"
      && expectedUserId !== null
      && result.session.user.id !== expectedUserId) {
      result = { status: "unauthenticated" };
    }
    apply(result);
    return true;
  }
}

async function clearSession(client: AdminAuthClient): Promise<void> {
  try {
    await client.auth.signOut();
  } catch {
    // Authorization is already cleared in the UI; a rejected cleanup must stay fail-closed.
  }
}

export async function authorizeAdminSession(
  client: AdminAuthClient,
  session: AdminSession
): Promise<AdminAuthResult> {
  try {
    const expectedUserId = session.user.id;
    const beforeCheck = await client.auth.getSession();
    if (beforeCheck.error) {
      await clearSession(client);
      return { status: "expired" };
    }
    if (beforeCheck.data.session?.user.id !== expectedUserId) {
      return { status: "unauthenticated" };
    }

    const { data: isAdmin, error } = await client.rpc("is_tts_admin");
    const afterCheck = await client.auth.getSession();
    if (afterCheck.error) {
      await clearSession(client);
      return { status: "expired" };
    }
    if (afterCheck.data.session?.user.id !== expectedUserId) {
      return { status: "unauthenticated" };
    }

    if (!error && isAdmin === true) {
      return { status: "authorized", session: afterCheck.data.session };
    }

    await clearSession(client);
    return { status: "forbidden" };
  } catch {
    await clearSession(client);
    return { status: "error" };
  }
}

export async function checkAdminSession(client: AdminAuthClient): Promise<AdminAuthResult> {
  try {
    const { data, error } = await client.auth.getSession();

    if (error) {
      await clearSession(client);
      return { status: "expired" };
    }

    if (!data.session) {
      return { status: "unauthenticated" };
    }

    return authorizeAdminSession(client, data.session);
  } catch {
    await clearSession(client);
    return { status: "error" };
  }
}

export async function signInAdmin(
  client: AdminAuthClient,
  email: string,
  password: string
): Promise<AdminAuthResult> {
  try {
    const { data, error } = await client.auth.signInWithPassword({ email, password });

    if (error || !data.session) {
      await clearSession(client);
      return { status: "unauthenticated" };
    }

    return authorizeAdminSession(client, data.session);
  } catch {
    await clearSession(client);
    return { status: "error" };
  }
}

export function revalidateAdminSession(
  client: AdminAuthClient,
  clearAuthorization: () => void
): Promise<AdminAuthResult> {
  clearAuthorization();
  return checkAdminSession(client);
}
