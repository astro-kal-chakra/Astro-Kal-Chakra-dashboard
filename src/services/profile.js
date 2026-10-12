/**
 * The signed-in admin's own security settings and active sign-in sessions.
 * Server-only, like the rest of `@/services`.
 */
import { api } from "@/lib/api";

/** `{ twoFactor: { enabled, method, enabledAt, recoveryCodesLeft }, passwordChangedAt, sessions }` */
export const getMySecurity = () => api("/me/security");
