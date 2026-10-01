import { cookies } from "next/headers";
import { ROLE_MAP, can } from "@/config/permissions";
import AccessDenied from "@/components/common/AccessDenied";

/** Server-only helpers for the signed-in admin (demo: stored in cookies). */
export async function getCurrentAdmin() {
  const store = await cookies();
  const roleKey = store.get("admin_role")?.value ?? "super_admin";
  const role = ROLE_MAP[roleKey] ?? ROLE_MAP.super_admin;
  return {
    id: "ADM101",
    name: store.get("admin_name")?.value ?? "Vandana Rao",
    email: store.get("admin_email")?.value ?? "vandana@astroadmin.in",
    role,
  };
}

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
