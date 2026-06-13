import { createAuthClient } from "better-auth/react";

// baseURL intentionally omitted — client defaults to window.location.origin,
// which automatically works across all domains (localhost, Vercel preview, production)
export const authClient = createAuthClient();

export const { signIn, signOut, useSession } = authClient;
