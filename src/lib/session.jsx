import { cache } from "react";
import { cookies } from "next/headers";
import { ROLE_MAP, can } from "@/config/permissions";
import { PREVIEW_COOKIE } from "@/lib/authCookies";
import { api } from "@/lib/api";
import AccessDenied from "@/components/common/AccessDenied";

/**
 * The signed-in admin from `GET /admin/me` (role + permission matrix), fetched
 * once per request. A Super Admin can preview the UI as another system role:
 * that only changes what the dashboard shows — the backend keeps using the real role.
 */
export const getCurrentAdmin = cache(async () => {
  const me = await api("/me");
  const realRole = me.role;
  const previewKey = (await cookies()).get(PREVIEW_COOKIE)?.value;
  const preview = realRole.key === "super_admin" && previewKey && previewKey !== realRole.key ? ROLE_MAP[previewKey] : null;
  return {
    id: me.id,
    name: me.name,
    email: me.email,
    role: preview ?? realRole,
    realRole,
    previewing: Boolean(preview),
    idleTimeoutSeconds: me.idleTimeoutSeconds ?? 1800,
  };
});

/**
 * Server-side permission gate for pages. Usage:
 *   const { admin, denied } = await checkAccess("users");
 *   if (denied) return denied;
 */
export async function checkAccess(module, action = "view") {
  const admin = await getCurrentAdmin();
  const allowed = can(admin.role, module, action);
  return { admin, denied: allowed ? null : <AccessDenied module={module} roleName={admin.role.name} /> };
}
