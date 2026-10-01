"use client";

import { createContext, useContext, useMemo } from "react";
import { can as canFn } from "@/config/permissions";

const AdminContext = createContext(null);

/** Exposes the signed-in admin + a `can(module, action)` helper to client UI. */
export function AdminProvider({ admin, children }) {
  const value = useMemo(
    () => ({ admin, can: (module, action = "view") => canFn(admin.role, module, action) }),
    [admin]
  );
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export const useAdmin = () => useContext(AdminContext);

/** Renders children only when the admin has the permission. UI mirror of backend checks. */
export function Can({ module, action = "view", children, fallback = null }) {
  const { can } = useAdmin();
  return can(module, action) ? children : fallback;
}
